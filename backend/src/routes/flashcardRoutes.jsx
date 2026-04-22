const express = require("express");

const FlashcardDeck = require("../models/FlashcardDeckModel.jsx");
const User = require("../models/UserModel.jsx");
const { readBearerToken, verifyAuthToken } = require("../utils/authToken.cjs");

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
  } catch (_err) {
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

function normalizeStudentSemester(userOrValue) {
  const directSemester =
    typeof userOrValue === "object" && userOrValue !== null
      ? Number(userOrValue.semester)
      : Number(userOrValue);
  if (Number.isFinite(directSemester) && directSemester >= 1) {
    return Math.floor(directSemester);
  }

  const academicYearLabel =
    typeof userOrValue === "object" && userOrValue !== null
      ? String(userOrValue.academicYear || "").trim().toLowerCase()
      : "";
  const semesterLabel =
    typeof userOrValue === "object" && userOrValue !== null
      ? String(userOrValue.semester || "").trim().toLowerCase()
      : String(userOrValue || "").trim().toLowerCase();

  const yearMatch = academicYearLabel.match(/^(\d+)/);
  const semesterMatch = semesterLabel.match(/^(\d+)/);

  if (yearMatch && semesterMatch) {
    const year = Number(yearMatch[1]);
    const semesterOfYear = Number(semesterMatch[1]);
    if (
      Number.isFinite(year) &&
      Number.isFinite(semesterOfYear) &&
      year >= 1 &&
      semesterOfYear >= 1 &&
      semesterOfYear <= 2
    ) {
      return (year - 1) * 2 + semesterOfYear;
    }
  }

  const fallbackSemesterMatch = semesterLabel.match(/(\d+)/);
  if (fallbackSemesterMatch) {
    const semesterNumber = Number(fallbackSemesterMatch[1]);
    if (Number.isFinite(semesterNumber) && semesterNumber >= 1) {
      return Math.min(8, Math.floor(semesterNumber));
    }
  }

  return null;
}

function canStudentAccessSemester(studentSemesterValue, deckSemesterValue) {
  const studentSemester = normalizeStudentSemester(studentSemesterValue);
  const deckSemester = Number(deckSemesterValue);

  if (!Number.isFinite(studentSemester) || !Number.isFinite(deckSemester)) {
    return false;
  }

  if (studentSemester >= 7) {
    return true;
  }

  return deckSemester <= studentSemester;
}

router.get("/", attachUser, requireStudent, async (req, res) => {
  try {
    const { semester, q } = req.query;
    const filter = { createdBy: req.user._id };
    if (semester !== undefined && semester !== "") {
      const n = Number(semester);
      if (Number.isFinite(n) && n >= 1) {
        if (!canStudentAccessSemester(req.user, n)) {
          return res.status(403).json({
            message: "You cannot filter flashcards beyond your registered semester.",
          });
        }
        filter.semester = n;
      }
    }

    let decks = await FlashcardDeck.find(filter).sort({ createdAt: -1 }).lean();
    decks = decks.filter((deck) => canStudentAccessSemester(req.user, deck.semester));

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
    if (!canStudentAccessSemester(req.user, deck.semester)) {
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
