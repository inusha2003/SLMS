const { generateContent } = require("../services/aiGenerateService.jsx");

function sendGenerateHelp(req, res) {
  res.status(200).json({
    message: "Use POST with JSON body.",
    exampleBody: {
      type: "notes",
      topic: "Java",
      subject: "OOP",
      semester: "3",
    },
    allowedTypes: ["notes", "mcq", "flashcards"],
  });
}

async function handleGeneratePost(req, res) {
  try {
    const { type, topic, subject, semester } = req.body || {};

    if (!type || !topic || !subject || semester === undefined || semester === "") {
      return res.status(400).json({
        message: "Missing required fields: type, topic, subject, semester.",
      });
    }

    const allowedTypes = ["notes", "mcq", "flashcards"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid type. Allowed types: notes, mcq, flashcards.",
      });
    }

    const result = await generateContent(type, {
      topic: String(topic).trim(),
      subject: String(subject).trim(),
      semester: String(semester).trim(),
    });

    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.statusCode || err.status || 500;
    if (statusCode !== 429) {
      console.error("AI generation error:", err);
    } else {
      console.warn("Gemini rate limit / quota:", err.message?.slice(0, 120));
    }

    return res.status(statusCode).json({
      message: err.message || "AI generation failed.",
      ...(err.code && { code: err.code }),
      ...(err.retryAfterSeconds != null && {
        retryAfterSeconds: err.retryAfterSeconds,
      }),
    });
  }
}

module.exports = {
  sendGenerateHelp,
  handleGeneratePost,
};