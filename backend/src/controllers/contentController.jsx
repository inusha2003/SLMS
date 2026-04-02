const {
  generateContent,
  generateContentFromUploadedFile,
} = require("../services/aiGenerateService.jsx");

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

function validateGenerateFields(
  { type, topic, subject, semester },
  { requireDetails = true } = {}
) {
  const allowedTypes = ["notes", "mcq", "flashcards"];
  if (!allowedTypes.includes(type)) {
    return "Invalid type. Allowed types: notes, mcq, flashcards.";
  }

  if (
    requireDetails &&
    (!topic || !subject || semester === undefined || semester === "")
  ) {
    return "Missing required fields: type, topic, subject, semester.";
  }

  return "";
}

async function handleGeneratePost(req, res) {
  try {
    const { type, topic, subject, semester } = req.body || {};

    const validationMessage = validateGenerateFields(
      {
        type,
        topic,
        subject,
        semester,
      },
      { requireDetails: true }
    );
    if (validationMessage) {
      return res.status(400).json({
        message: validationMessage,
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

async function handleGenerateFromFilePost(req, res) {
  try {
    const { type, topic, subject, semester } = req.body || {};
    const validationMessage = validateGenerateFields(
      {
        type,
        topic,
        subject,
        semester,
      },
      { requireDetails: false }
    );

    if (validationMessage) {
      return res.status(400).json({
        message: validationMessage,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF or PPTX file.",
      });
    }

    const result = await generateContentFromUploadedFile(type, {
      topic: String(topic).trim(),
      subject: String(subject).trim(),
      semester: String(semester).trim(),
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      sourceLabel: req.file.originalname,
    });

    return res.status(200).json({
      ...result,
      source: {
        kind: "file",
        fileName: req.file.originalname,
      },
    });
  } catch (err) {
    const statusCode = err.statusCode || err.status || 500;
    if (statusCode !== 429) {
      console.error("AI file generation error:", err);
    } else {
      console.warn("Gemini rate limit / quota:", err.message?.slice(0, 120));
    }

    return res.status(statusCode).json({
      message: err.message || "AI generation from file failed.",
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
  handleGenerateFromFilePost,
};
