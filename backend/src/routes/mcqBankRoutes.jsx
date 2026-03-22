const express = require("express");

const Exam = require("../models/ExamModel.jsx");

const router = express.Router();

/**
 * GET /api/mcq-bank
 * Query: semester (optional), q (optional search)
 * Exported for app.js so we can register exact paths (Express 5 + trailing slash).
 */
async function listUpcomingMcqSets(req, res) {
  try {
    const { semester, q } = req.query;
    const filter = { status: "Upcoming" };

    if (semester !== undefined && semester !== "") {
      const n = Number(semester);
      if (Number.isFinite(n) && n >= 1) filter.semester = n;
    }

    let exams = await Exam.find(filter).sort({ createdAt: -1 }).lean();

    if (q && String(q).trim()) {
      const term = String(q).trim().toLowerCase();
      exams = exams.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(term)) ||
          (e.subject && e.subject.toLowerCase().includes(term))
      );
    }

    const sets = exams.map((e) => ({
      id: e._id,
      title: e.title,
      subject: e.subject,
      semester: e.semester,
      questionCount: Array.isArray(e.questions) ? e.questions.length : 0,
      duration: e.duration,
      totalMarks: e.totalMarks,
      status: e.status,
      isAiGenerated: false,
    }));

    return res.status(200).json({ sets });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch MCQ sets." });
  }
}

router.get("/", listUpcomingMcqSets);

router.listUpcomingMcqSets = listUpcomingMcqSets;
module.exports = router;
