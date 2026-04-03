const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const FlashcardDeck = require("../models/FlashcardDeckModel.jsx");
const {
  sendGenerateHelp,
  handleGeneratePost,
  handleGenerateFromFilePost,
} = require("../controllers/contentController.jsx");
const {
  SUPPORTED_UPLOAD_MIME_TYPES,
} = require("../services/aiGenerateService.jsx");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
    fileFilter: (req, file, cb) => {
    if (!SUPPORTED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      const err = new Error("Only PDF and PPTX files are supported.");
      err.statusCode = 400;
      cb(err);
      return;
    }
    cb(null, true);
  },
});

async function loadMainUserModel() {
  return (await import("../models/User.js")).default;
}

async function loadUserFromHeader(req) {
  const header = req.header("authorization") || req.header("Authorization") || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : "";
  if (token) {
    const secret = String(process.env.JWT_SECRET || "").trim();
    if (!secret) return null;
    try {
      const payload = jwt.verify(token, secret);
      const userId = payload?.userId || payload?.sub;
      if (userId && /^[a-fA-F0-9]{24}$/.test(String(userId))) {
        const User = await loadMainUserModel();
        return User.findById(userId).lean();
      }
      return null;
    } catch {
      return null;
    }
  }

  const userId = req.header("x-user-id");
  if (!userId || !mongoose.isValidObjectId(userId)) return null;
  const User = await loadMainUserModel();
  return User.findById(userId).lean();
}

async function attachUser(req, res, next) {
  try {
    req.user = await loadUserFromHeader(req);
    return next();
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
}

function requireStudent(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Please log in to save flashcard decks." });
  }
  if (req.user.role !== "Student") {
    return res.status(403).json({ message: "Student access only." });
  }
  return next();
}

function canStudentAccessSemester(studentSemesterValue, contentSemesterValue) {
  const studentSemester = Number(studentSemesterValue);
  const contentSemester = Number(contentSemesterValue);

  if (!Number.isFinite(studentSemester) || !Number.isFinite(contentSemester)) {
    return false;
  }

  if (studentSemester >= 7) {
    return true;
  }

  return contentSemester <= studentSemester;
}

// Base content route
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Content API is working",
  });
});

// AI generate help
router.get("/generate", sendGenerateHelp);

// AI generate post
router.post("/generate", handleGeneratePost);
router.post("/generate-from-file", upload.single("lessonFile"), handleGenerateFromFilePost);

/**
 * POST /api/content/flashcard-decks
 * Requires student auth
 */
router.post("/flashcard-decks", attachUser, requireStudent, async (req, res) => {
  try {
    const {
      title,
      subject,
      semester,
      cards = [],
      isAiGenerated = true,
    } = req.body || {};

    if (!title || !subject || semester === undefined || semester === "") {
      return res.status(400).json({
        message: "Missing required fields: title, subject, semester.",
      });
    }

    const semNum = Number(semester);

    if (!Number.isFinite(semNum) || semNum < 1) {
      return res.status(400).json({
        message: "Invalid semester.",
      });
    }

    if (!canStudentAccessSemester(req.user?.semester, semNum)) {
      return res.status(403).json({
        message: "You cannot save flashcards for a semester beyond your registered semester.",
      });
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({
        message: "cards[] must be a non-empty array.",
      });
    }

    const sanitized = cards.map((card) => ({
      question: String(card.question || "").trim(),
      answer: String(card.answer || "").trim(),
    }));

    if (sanitized.some((card) => !card.question || !card.answer)) {
      return res.status(400).json({
        message: "Each card must have non-empty question and answer.",
      });
    }

    const deck = await FlashcardDeck.create({
      title: String(title).trim(),
      subject: String(subject).trim(),
      semester: semNum,
      createdBy: req.user._id,
      cards: sanitized,
      isAiGenerated: Boolean(isAiGenerated),
    });

    return res.status(201).json({
      message: "Flashcard deck saved.",
      deck,
    });
  } catch (err) {
    console.error("Flashcard deck save error:", err);
    return res.status(500).json({
      message: "Failed to save flashcard deck.",
    });
  }
});

module.exports = router;
