const express = require("express");

const Exam = require("../models/ExamModel.jsx");
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

function requireSignedInUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Please log in to access the MCQ Bank." });
  }
  return next();
}

function isFourthYearSemester(semesterValue) {
  const semesterNumber = Number(semesterValue);
  return Number.isFinite(semesterNumber) && semesterNumber >= 7;
}

function canStudentAccessMcqSet(student, exam) {
  const studentSemester = Number(student?.semester);
  const examSemester = Number(exam?.semester);

  if (!Number.isFinite(studentSemester) || !Number.isFinite(examSemester)) {
    return false;
  }

  if (isFourthYearSemester(studentSemester)) {
    return true;
  }

  return examSemester <= studentSemester;
}

function validateSearchQuery(value) {
  const raw = String(value || "");
  const trimmed = raw.trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return { ok: true, normalized: "" };
  }

  if (trimmed.length > 60) {
    return {
      ok: false,
      message: "Search must be 60 characters or fewer.",
    };
  }

  if (/[<>]/.test(trimmed) || /[\u0000-\u001F\u007F]/.test(trimmed)) {
    return {
      ok: false,
      message: "Search contains unsupported characters.",
    };
  }

  if (!/[A-Za-z0-9]/.test(trimmed)) {
    return {
      ok: false,
      message: "Search must include at least one letter or number.",
    };
  }

  if (!/^[A-Za-z0-9\s&'(),./+-]+$/.test(trimmed)) {
    return {
      ok: false,
      message: "Search can contain letters, numbers, spaces, and basic punctuation only.",
    };
  }

  return { ok: true, normalized: trimmed };
}

function toSetSummary(exam) {
  return {
    id: exam._id,
    title: exam.title,
    subject: exam.subject,
    semester: exam.semester,
    questionCount: Array.isArray(exam.questions) ? exam.questions.length : 0,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    status: exam.status,
    isAiGenerated: false,
  };
}

async function listUpcomingMcqSets(req, res) {
  try {
    const { semester, q, subject } = req.query;
    const searchValidation = validateSearchQuery(q);
    if (!searchValidation.ok) {
      return res.status(400).json({ message: searchValidation.message });
    }

    const filter = { kind: "mcq_bank" };
    if (
      req.user?.role === "Student" &&
      req.user?.semester &&
      !isFourthYearSemester(req.user.semester)
    ) {
      filter.semester = { $lte: Number(req.user.semester) };
    }

    let exams = await Exam.find(filter)
      .sort({ semester: 1, subject: 1, createdAt: -1 })
      .lean();

    if (semester !== undefined && semester !== "") {
      const semesterNumber = Number(semester);
      if (Number.isFinite(semesterNumber) && semesterNumber >= 1) {
        exams = exams.filter((exam) => Number(exam.semester) === semesterNumber);
      }
    }

    const subjectOptions = Array.from(
      new Set(
        exams
          .map((exam) => String(exam.subject || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    if (subject && String(subject).trim()) {
      const wantedSubject = String(subject).trim().toLowerCase();
      exams = exams.filter(
        (exam) => String(exam.subject || "").trim().toLowerCase() === wantedSubject
      );
    }

    if (searchValidation.normalized) {
      const term = searchValidation.normalized.toLowerCase();
      exams = exams.filter((exam) => {
        const title = String(exam.title || "").toLowerCase();
        const subjectName = String(exam.subject || "").toLowerCase();
        return title.includes(term) || subjectName.includes(term);
      });
    }

    return res.status(200).json({
      sets: exams.map(toSetSummary),
      filters: {
        subjects: subjectOptions,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch MCQ sets." });
  }
}

async function getMcqSetById(req, res) {
  try {
    const { examId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(examId)) {
      return res.status(400).json({ message: "Invalid MCQ set id." });
    }

    const exam = await Exam.findOne({ _id: examId, kind: "mcq_bank" }).lean();
    if (!exam) {
      return res.status(404).json({ message: "MCQ set not found." });
    }

    if (req.user?.role === "Student" && !canStudentAccessMcqSet(req.user, exam)) {
      return res.status(403).json({
        message: "You do not have access to this MCQ set for your current semester.",
      });
    }

    return res.status(200).json({
      set: {
        ...toSetSummary(exam),
        questions: Array.isArray(exam.questions)
          ? exam.questions.map((question, index) => ({
              index,
              question: question.question,
              options: question.options || [],
              correctAnswer: question.correctAnswer,
              explanation: question.explanation || "No explanation added yet.",
            }))
          : [],
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch MCQ set." });
  }
}

router.get("/", attachUser, requireSignedInUser, listUpcomingMcqSets);
router.get("/:examId", attachUser, requireSignedInUser, getMcqSetById);

router.listUpcomingMcqSets = listUpcomingMcqSets;
module.exports = router;
