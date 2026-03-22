const express = require("express");

const FlashcardDeck = require("../models/FlashcardDeckModel.jsx");

const router = express.Router();

/**
 * GET /api/flashcards
 * Query: semester (optional), q (optional search on title/subject)
 */
router.get("/", async (req, res) => {
  try {
    const { semester, q } = req.query;
    const filter = {};
    if (semester !== undefined && semester !== "") {
      const n = Number(semester);
      if (Number.isFinite(n) && n >= 1) filter.semester = n;
    }

    let decks = await FlashcardDeck.find(filter).sort({ createdAt: -1 }).lean();

    if (q && String(q).trim()) {
      const term = String(q).trim().toLowerCase();
      decks = decks.filter(
        (d) =>
          (d.title && d.title.toLowerCase().includes(term)) ||
          (d.subject && d.subject.toLowerCase().includes(term))
      );
    }

    const payload = decks.map((d) => ({
      id: d._id,
      title: d.title,
      subject: d.subject,
      semester: d.semester,
      cardCount: Array.isArray(d.cards) ? d.cards.length : 0,
      isAiGenerated: Boolean(d.isAiGenerated),
      createdAt: d.createdAt,
    }));

    return res.status(200).json({ decks: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch flashcard decks." });
  }
});

/**
 * GET /api/flashcards/:deckId
 */
router.get("/:deckId", async (req, res) => {
  try {
    const { deckId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(deckId)) {
      return res.status(400).json({ message: "Invalid deck id." });
    }
    const deck = await FlashcardDeck.findById(deckId).lean();
    if (!deck) return res.status(404).json({ message: "Deck not found." });
    return res.status(200).json({ deck });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch deck." });
  }
});

module.exports = router;
