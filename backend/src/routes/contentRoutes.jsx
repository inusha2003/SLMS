const express = require("express");
const mongoose = require("mongoose");

const FlashcardDeck = require("../models/FlashcardDeckModel.jsx");
const {
  sendGenerateHelp,
  handleGeneratePost,
} = require("../controllers/contentController.jsx");

const router = express.Router();

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

/**
 * POST /api/content/flashcard-decks
 * Headers: x-user-id (Mongo ObjectId)
 */
router.post("/flashcard-decks", async (req, res) => {
  try {
    const userId = req.header("x-user-id");

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Missing or invalid x-user-id header (Mongo ObjectId).",
      });
    }

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
      createdBy: userId,
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