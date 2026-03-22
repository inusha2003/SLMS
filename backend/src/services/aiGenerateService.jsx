const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Turn Google SDK errors into clean HTTP-style errors for our API.
 */
function normalizeGeminiError(err) {
  const msg = err?.message || String(err);
  const status = err?.status ?? err?.statusCode;

  const is429 =
    status === 429 ||
    /429|Too Many Requests|quota|rate limit|exceeded your current quota/i.test(msg);

  if (is429) {
    const retryMatch = msg.match(/retry in ([\d.]+)s/i);
    const retryAfterSeconds = retryMatch
      ? Math.min(120, Math.ceil(parseFloat(retryMatch[1], 10)))
      : undefined;
    const e = new Error(
      "Gemini API quota or rate limit reached (often free-tier daily/minute limits). " +
        "Wait and retry, try another time, set GEMINI_MODEL to a lighter model in .env " +
        "(e.g. gemini-2.0-flash-lite), or enable billing in Google AI Studio. " +
        "Docs: https://ai.google.dev/gemini-api/docs/rate-limits"
    );
    e.statusCode = 429;
    e.code = "GEMINI_RATE_LIMIT";
    if (retryAfterSeconds != null) e.retryAfterSeconds = retryAfterSeconds;
    return e;
  }

  const looksLikeModel404 =
    status === 404 ||
    (/models\/[^/\s]+/i.test(msg) && /not found|is not found|404/i.test(msg));

  if (looksLikeModel404) {
    const hint =
      "Try GEMINI_MODEL=gemini-2.5-flash-lite or gemini-2.5-flash (see https://ai.google.dev/gemini-api/docs/models/gemini ).";
    const e = new Error(
      `Gemini model not found for this API key. ${hint} Google: ${msg.slice(0, 280)}`
    );
    e.statusCode = 502;
    e.code = "GEMINI_MODEL_NOT_FOUND";
    return e;
  }

  const e = new Error(msg.length > 600 ? `${msg.slice(0, 600)}…` : msg);
  e.statusCode =
    typeof status === "number" && status >= 400 && status < 600 ? status : 502;
  e.code = "GEMINI_ERROR";
  return e;
}

async function generateWithModel(model, prompt) {
  try {
    return await model.generateContent(prompt);
  } catch (err) {
    throw normalizeGeminiError(err);
  }
}

/**
 * Try primary model, then optional fallback (separate free-tier buckets).
 * Set GEMINI_MODEL_FALLBACK= to empty in .env to disable fallback.
 */
async function generateWithModelChain(genAI, modelNames, prompt) {
  const names = [...new Set(modelNames.filter(Boolean))];
  let lastErr;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    try {
      const model = genAI.getGenerativeModel({ model: name });
      return await generateWithModel(model, prompt);
    } catch (e) {
      lastErr = e;
      const tryNext =
        i < names.length - 1 &&
        (e.code === "GEMINI_RATE_LIMIT" || e.code === "GEMINI_MODEL_NOT_FOUND");
      if (!tryNext) throw e;
    }
  }
  throw lastErr;
}

/**
 * Current Gemini API model ids (Google AI Studio). Older 2.0 / 1.5 names often 404 on new keys.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 */
const DEFAULT_MODEL_CHAIN = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

function buildModelChain() {
  const primary = (process.env.GEMINI_MODEL || "").trim();
  const fbRaw = process.env.GEMINI_MODEL_FALLBACK;
  const fallbackExplicit = fbRaw !== undefined && fbRaw !== null;
  const fallback = fallbackExplicit ? String(fbRaw).trim() : "";

  // Only one model: GEMINI_MODEL=x and GEMINI_MODEL_FALLBACK= (empty)
  if (primary && fallbackExplicit && !fallback) {
    return [primary];
  }

  if (!primary) {
    return [...DEFAULT_MODEL_CHAIN];
  }

  const chain = [];
  if (primary) chain.push(primary);
  if (fallback) chain.push(fallback);
  for (const m of DEFAULT_MODEL_CHAIN) {
    if (!chain.includes(m)) chain.push(m);
  }
  return chain;
}

/**
 * @param {string} type - 'notes' | 'mcq' | 'flashcards'
 * @param {{ topic: string, subject: string, semester: string }} params
 * @returns {Promise<{ kind: string, data: unknown }>}
 */
async function generateContent(type, { topic, subject, semester }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "GEMINI_API_KEY is not set. Add it to backend/.env to enable AI generation."
    );
    err.statusCode = 503;
    throw err;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelChain = buildModelChain();

  const base = `Topic: ${topic}\nSubject: ${subject}\nSemester: ${semester}\n`;

  if (type === "notes") {
    const prompt = `${base}
Write concise study notes in Markdown. Use headings, bullet points, and bold key terms.`;
    const result = await generateWithModelChain(genAI, modelChain, prompt);
    const text = result.response.text();
    return { kind: "notes", data: { markdown: text } };
  }

  if (type === "mcq") {
    const prompt = `${base}
Create exactly 8 multiple choice questions. Each question must have exactly 4 options (A, B, C, D), one correctAnswer (the full text of the correct option), and a short explanation.

Respond with ONLY valid JSON (no markdown fences), shape:
{"questions":[{"question":"...","options":["opt1","opt2","opt3","opt4"],"correctAnswer":"...","explanation":"..."}]}`;
    const result = await generateWithModelChain(genAI, modelChain, prompt);
    const text = result.response.text().trim();
    let json;
    try {
      json = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    } catch {
      const err = new Error("Could not parse MCQ JSON from AI response.");
      err.statusCode = 502;
      throw err;
    }
    return { kind: "mcq", data: json };
  }

  if (type === "flashcards") {
    const prompt = `${base}
Create 10–12 study flashcards in Q&A format.

Respond with ONLY valid JSON (no markdown fences), shape:
{"cards":[{"question":"...","answer":"..."}]}`;
    const result = await generateWithModelChain(genAI, modelChain, prompt);
    const text = result.response.text().trim();
    let json;
    try {
      json = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    } catch {
      const err = new Error("Could not parse flashcards JSON from AI response.");
      err.statusCode = 502;
      throw err;
    }
    return { kind: "flashcards", data: json };
  }

  const err = new Error("Invalid type");
  err.statusCode = 400;
  throw err;
}

module.exports = { generateContent };
