const express = require("express");

const FlashcardDeck = require("../models/FlashcardDeckModel.jsx");
const User = require("../models/UserModel.jsx");
const { readBearerToken, verifyAuthToken } = require("../utils/authToken.js");

const router = express.Router();

async function loadUserFromHeader(req) {
  const bearerToken = readBearerToken(req);
  if (bearerToken) {
    const payload = verifyAuthToken(bearerToken);
    if (payload?.sub && /^[a-fA-F0-9]{24}$/.test(payload.sub)) {
      return User.findById(payload.sub).lean();
    }
    return null;
  }

  const userId = req.header("x-user-id");
  if (!userId || !/^[a-fA-F0-9]{24}$/.test(userId)) return null;
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
    return res.status(401).json({ message: "Please log in to access your flashcards." });
  }
  if (req.user.role !== "Student") {
    return res.status(403).json({ message: "Student access only." });
  }
  return next();
}

function canStudentAccessSemester(studentSemesterValue, deckSemesterValue) {
  const studentSemester = Number(studentSemesterValue);
  const deckSemester = Number(deckSemesterValue);

  if (!Number.isFinite(studentSemester) || !Number.isFinite(deckSemester)) {
    return false;
  }

  if (studentSemester >= 7) {
    return true;
  }

  return deckSemester <= studentSemester;
}

/**
 * GET /api/flashcards
 * Query: semester (optional), q (optional search on title/subject)
 */
router.get("/", attachUser, requireStudent, async (req, res) => {
  try {
    const { semester, q } = req.query;
    const filter = { createdBy: req.user._id };
    if (semester !== undefined && semester !== "") {
      const n = Number(semester);
      if (Number.isFinite(n) && n >= 1) {
        if (!canStudentAccessSemester(req.user?.semester, n)) {
          return res.status(403).json({
            message: "You cannot filter flashcards beyond your registered semester.",
          });
        }
        filter.semester = n;
      }
    }

    let decks = await FlashcardDeck.find(filter).sort({ createdAt: -1 }).lean();
    decks = decks.filter((deck) => canStudentAccessSemester(req.user?.semester, deck.semester));

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
router.get("/:deckId", attachUser, requireStudent, async (req, res) => {
  try {
    const { deckId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(deckId)) {
      return res.status(400).json({ message: "Invalid deck id." });
    }
    const deck = await FlashcardDeck.findOne({
      _id: deckId,
      createdBy: req.user._id,
    }).lean();
    if (!deck) return res.status(404).json({ message: "Deck not found." });
    if (!canStudentAccessSemester(req.user?.semester, deck.semester)) {
      return res.status(403).json({
        message: "You do not have access to this flashcard deck for your current semester.",
      });
    }
    return res.status(200).json({ deck });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch deck." });
  }
});

/**
 * DELETE /api/flashcards/:deckId
 */
router.delete("/:deckId", attachUser, requireStudent, async (req, res) => {
  try {
    const { deckId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(deckId)) {
      return res.status(400).json({ message: "Invalid deck id." });
    }

    const deletedDeck = await FlashcardDeck.findOneAndDelete({
      _id: deckId,
      createdBy: req.user._id,
    }).lean();

    if (!deletedDeck) {
      return res.status(404).json({ message: "Deck not found." });
    }

    return res.status(200).json({ message: "Flashcard deck deleted successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete flashcard deck." });
  }
});

module.exports = router;
