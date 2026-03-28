const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const SUPPORTED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function normalizeGeminiError(err) {
  const msg = err?.message || String(err);
  const status = err?.status ?? err?.statusCode;

  const is429 =
    status === 429 ||
    /429|Too Many Requests|quota|rate limit|exceeded your current quota/i.test(
      msg
    );

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
      `Gemini model not found for this API key. ${hint} Google: ${msg.slice(
        0,
        280
      )}`
    );
    e.statusCode = 502;
    e.code = "GEMINI_MODEL_NOT_FOUND";
    return e;
  }

  const e = new Error(msg.length > 600 ? `${msg.slice(0, 600)}...` : msg);
  e.statusCode =
    typeof status === "number" && status >= 400 && status < 600 ? status : 502;
  e.code = "GEMINI_ERROR";
  return e;
}

function decodeXmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, " ")
    .replace(/&#13;/g, " ");
}

function stripXmlTags(text) {
  return decodeXmlEntities(String(text || "").replace(/<[^>]+>/g, " "));
}

async function extractPptxText(fileBuffer, sourceLabel) {
  if (process.platform !== "win32") {
    const err = new Error(
      "PowerPoint upload is currently supported on Windows only. Use PDF on this server."
    );
    err.statusCode = 400;
    throw err;
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "slms-pptx-"));
  const baseName = String(sourceLabel || "lesson").replace(/[^\w.-]+/g, "_");
  const pptxPath = path.join(tempDir, `${baseName || "lesson"}.pptx`);
  const zipPath = path.join(tempDir, `${baseName || "lesson"}.zip`);
  const extractDir = path.join(tempDir, "unzipped");

  try {
    await fs.writeFile(pptxPath, fileBuffer);
    await fs.copyFile(pptxPath, zipPath);

    await execFileAsync("powershell", [
      "-NoProfile",
      "-Command",
      "Expand-Archive",
      "-LiteralPath",
      zipPath,
      "-DestinationPath",
      extractDir,
      "-Force",
    ]);

    const slidesDir = path.join(extractDir, "ppt", "slides");
    const entries = await fs.readdir(slidesDir);
    const slideFiles = entries
      .filter((name) => /^slide\d+\.xml$/i.test(name))
      .sort((a, b) => {
        const aNum = Number(a.match(/\d+/)?.[0] || 0);
        const bNum = Number(b.match(/\d+/)?.[0] || 0);
        return aNum - bNum;
      });

    const slides = [];
    for (const fileName of slideFiles) {
      const xml = await fs.readFile(path.join(slidesDir, fileName), "utf8");
      const textParts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
        .map((match) => stripXmlTags(match[1]))
        .map((part) => part.trim())
        .filter(Boolean);

      if (textParts.length > 0) {
        const slideNumber = Number(fileName.match(/\d+/)?.[0] || slides.length + 1);
        slides.push(`Slide ${slideNumber}: ${textParts.join(" ")}`);
      }
    }

    const combined = slides.join("\n").trim();
    if (!combined) {
      const err = new Error(
        "Could not extract readable text from the PowerPoint file. Try exporting it as PDF."
      );
      err.statusCode = 400;
      throw err;
    }

    return combined;
  } catch (err) {
    if (err.statusCode) throw err;
    const e = new Error(
      "Could not read the PowerPoint file. Try a .pptx file with selectable text or export it as PDF."
    );
    e.statusCode = 400;
    throw e;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function generateWithModel(model, prompt) {
  try {
    return await model.generateContent(prompt);
  } catch (err) {
    throw normalizeGeminiError(err);
  }
}

async function generateWithModelChain(genAI, modelNames, prompt) {
  const names = [...new Set(modelNames.filter(Boolean))];
  let lastErr;

  for (let i = 0; i < names.length; i += 1) {
    const name = names[i];
    try {
      const model = genAI.getGenerativeModel({ model: name });
      return await generateWithModel(model, prompt);
    } catch (e) {
      lastErr = e;
      const tryNext =
        i < names.length - 1 &&
        (e.code === "GEMINI_RATE_LIMIT" ||
          e.code === "GEMINI_MODEL_NOT_FOUND");
      if (!tryNext) throw e;
    }
  }

  throw lastErr;
}

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

  if (primary && fallbackExplicit && !fallback) {
    return [primary];
  }

  if (!primary) {
    return [...DEFAULT_MODEL_CHAIN];
  }

  const chain = [];
  if (primary) chain.push(primary);
  if (fallback) chain.push(fallback);

  for (const model of DEFAULT_MODEL_CHAIN) {
    if (!chain.includes(model)) chain.push(model);
  }

  return chain;
}

function ensureApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const err = new Error(
      "GEMINI_API_KEY is not set. Add it to backend/.env to enable AI generation."
    );
    err.statusCode = 503;
    throw err;
  }

  return apiKey;
}

function buildDefaultTopicFromSource(sourceLabel) {
  const cleaned = String(sourceLabel || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Uploaded Lesson";
}

function normalizePromptMeta({ topic, subject, semester, sourceLabel }) {
  return {
    topic: String(topic || "").trim() || buildDefaultTopicFromSource(sourceLabel),
    subject: String(subject || "").trim() || "Uploaded Lesson",
    semester: String(semester || "").trim() || "Not specified",
  };
}

function createPrompt(type, { topic, subject, semester, sourceLabel }) {
  const meta = normalizePromptMeta({ topic, subject, semester, sourceLabel });
  const base = `Topic: ${meta.topic}\nSubject: ${meta.subject}\nSemester: ${meta.semester}\n`;
  const sourceDetails = sourceLabel
    ? `\nUse the uploaded lesson file as the main source.\nSource file: ${sourceLabel}\n`
    : "";

  if (type === "notes") {
    return `${base}${sourceDetails}

Create clean study notes for students.

Formatting rules:
- Start with a short 1-line overview.
- Use clear Markdown section headings for main topics.
- Under each heading, add short bullet points.
- Make the key term at the start of each bullet bold, then add a short explanation.
- Do not use horizontal rules.
- Do not add decorative symbols, filler text, or long paragraphs.
- Keep the structure easy to scan and suitable for UI cards.`;
  }

  if (type === "mcq") {
    return `${base}${sourceDetails}

Create exactly 10 multiple choice questions based on the lesson material.
Each question must have exactly 4 options (A, B, C, D), one correctAnswer (the full text of the correct option), and a short explanation.

Respond with ONLY valid JSON (no markdown fences), shape:
{"questions":[{"question":"...","options":["opt1","opt2","opt3","opt4"],"correctAnswer":"...","explanation":"..."}]}`;
  }

  if (type === "flashcards") {
    return `${base}${sourceDetails}

Create 10-12 study flashcards in Q&A format based on the lesson material.

Respond with ONLY valid JSON (no markdown fences), shape:
{"cards":[{"question":"...","answer":"..."}]}`;
  }

  const err = new Error("Invalid type");
  err.statusCode = 400;
  throw err;
}

async function parseStructuredResult(type, result) {
  if (type === "notes") {
    return { kind: "notes", data: { markdown: result.response.text() } };
  }

  const text = result.response.text().trim();
  try {
    const json = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    return type === "mcq"
      ? { kind: "mcq", data: json }
      : { kind: "flashcards", data: json };
  } catch {
    const err = new Error(
      type === "mcq"
        ? "Could not parse MCQ JSON from AI response."
        : "Could not parse flashcards JSON from AI response."
    );
    err.statusCode = 502;
    throw err;
  }
}

async function runGeneration(type, prompt, mediaPart) {
  const genAI = new GoogleGenerativeAI(ensureApiKey());
  const modelChain = buildModelChain();
  const request = mediaPart ? [{ text: prompt }, mediaPart] : prompt;
  const result = await generateWithModelChain(genAI, modelChain, request);
  return parseStructuredResult(type, result);
}

async function runGenerationFromExtractedText(type, prompt, extractedText) {
  const finalPrompt = `${prompt}

Lesson content:
${extractedText.slice(0, 50000)}`;
  return runGeneration(type, finalPrompt);
}

async function generateContent(type, { topic, subject, semester }) {
  const meta = normalizePromptMeta({ topic, subject, semester });
  const prompt = createPrompt(type, meta);
  const result = await runGeneration(type, prompt);
  return {
    ...result,
    meta,
  };
}

async function generateContentFromUploadedFile(
  type,
  { topic, subject, semester, fileBuffer, mimeType, sourceLabel }
) {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    const err = new Error("Uploaded file is empty or invalid.");
    err.statusCode = 400;
    throw err;
  }

  if (!SUPPORTED_UPLOAD_MIME_TYPES.has(String(mimeType || ""))) {
    const err = new Error("Only PDF and PPTX files are supported.");
    err.statusCode = 400;
    throw err;
  }

  const prompt = createPrompt(type, {
    topic,
    subject,
    semester,
    sourceLabel,
  });

  if (mimeType === "application/pdf") {
    const result = await runGeneration(type, prompt, {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType,
      },
    });
    return {
      ...result,
      meta: normalizePromptMeta({ topic, subject, semester, sourceLabel }),
    };
  }

  const extractedText = await extractPptxText(fileBuffer, sourceLabel);
  const result = await runGenerationFromExtractedText(type, prompt, extractedText);
  return {
    ...result,
    meta: normalizePromptMeta({ topic, subject, semester, sourceLabel }),
  };
}

module.exports = {
  generateContent,
  generateContentFromUploadedFile,
  SUPPORTED_UPLOAD_MIME_TYPES,
};
