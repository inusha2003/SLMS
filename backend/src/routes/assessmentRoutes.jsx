const express = require("express");

const router = express.Router();

const Exam = require("../models/ExamModel.jsx");
const User = require("../models/UserModel.jsx");
const Performance = require("../models/PerformanceModel.jsx");

async function loadUserFromHeader(req) {
  const userId = req.header("x-user-id");
  if (!userId) return null;
  if (!/^[a-fA-F0-9]{24}$/.test(userId)) return null;
  return User.findById(userId).lean();
}

function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: missing user." });
    }
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden: Admin only." });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
}

function requireStudent(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: missing user." });
    }
    if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Forbidden: Student only." });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
}

async function attachUser(req, res, next) {
  try {
    req.user = await loadUserFromHeader(req);
    return next();
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
}

// Health / basic check
router.get("/", (req, res) => {
  res.status(200).json({ message: "Assessment API is working" });
});

// =========================
// Admin: Create Exam (MCQs)
// =========================
router.post("/exams", attachUser, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      subject,
      semester,
      duration,
      totalMarks,
      questions = [],
    } = req.body || {};

    if (
      !title ||
      !subject ||
      !semester ||
      !duration ||
      !totalMarks ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        message:
          "Missing required fields. Provide title, subject, semester, duration, totalMarks and questions[].",
      });
    }

    // Minimal validation: ensure correctAnswer matches one of options.
    const sanitizedQuestions = questions.map((q, idx) => {
      const options = Array.isArray(q?.options) ? q.options : [];
      const correctAnswer = q?.correctAnswer;

      if (!q?.question || options.length !== 4 || !correctAnswer) {
        return null;
      }

      return {
        question: String(q.question),
        options: options.map((o) => String(o)),
        correctAnswer: String(correctAnswer),
        explanation: q?.explanation ? String(q.explanation) : "",
      };
    });

    if (sanitizedQuestions.some((q) => q === null)) {
      return res.status(400).json({ message: "Invalid questions payload." });
    }

    const { scheduledAt, startTime } = req.body || {};
    const examPayload = {
      title,
      subject,
      semester,
      duration,
      totalMarks,
      questions: sanitizedQuestions,
      createdBy: req.user._id,
      status: "Upcoming",
    };
    if (scheduledAt) {
      const d = new Date(scheduledAt);
      if (!Number.isNaN(d.getTime())) examPayload.scheduledAt = d;
    }
    if (startTime != null && String(startTime).trim()) {
      examPayload.startTime = String(startTime).trim();
    }

    const createdExam = await Exam.create(examPayload);

    return res.status(201).json({ message: "Exam created", exam: createdExam });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error creating exam." });
  }
});

// =========================
// Public: List exams
// =========================
router.get("/exams", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const exams = await Exam.find(filter)
      .sort({ scheduledAt: -1, createdAt: -1 })
      .lean();

    const ids = exams.map((e) => e._id);
    let attemptMap = {};
    if (ids.length > 0) {
      const agg = await Performance.aggregate([
        { $match: { exam: { $in: ids } } },
        { $group: { _id: "$exam", attemptCount: { $sum: 1 } } },
      ]);
      attemptMap = Object.fromEntries(
        agg.map((row) => [String(row._id), row.attemptCount])
      );
    }

    const examsWithCounts = exams.map((e) => ({
      ...e,
      attemptCount: attemptMap[String(e._id)] || 0,
    }));

    return res.status(200).json({ exams: examsWithCounts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error fetching exams." });
  }
});

// =========================
// Admin: Update exam (e.g. mark Completed)
// =========================
router.patch("/exams/:examId", attachUser, requireAdmin, async (req, res) => {
  try {
    const { examId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(examId)) {
      return res.status(400).json({ message: "Invalid examId." });
    }

    const { status, scheduledAt, startTime } = req.body || {};
    const updates = {};
    if (status === "Upcoming" || status === "Completed") updates.status = status;
    if (scheduledAt !== undefined) {
      const d = new Date(scheduledAt);
      if (!Number.isNaN(d.getTime())) updates.scheduledAt = d;
    }
    if (startTime != null && String(startTime).trim()) {
      updates.startTime = String(startTime).trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const exam = await Exam.findByIdAndUpdate(examId, { $set: updates }, {
      new: true,
    }).lean();
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    return res.status(200).json({ message: "Exam updated", exam });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error updating exam." });
  }
});

// =========================
// Student: My score for an exam (if submitted)
// =========================
router.get("/exams/:examId/result", attachUser, requireStudent, async (req, res) => {
  try {
    const { examId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(examId)) {
      return res.status(400).json({ message: "Invalid examId." });
    }

    const performance = await Performance.findOne({
      exam: examId,
      student: req.user._id,
    }).lean();

    if (!performance) {
      return res.status(404).json({ message: "No submission found for this exam." });
    }

    return res.status(200).json({ performance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
});

// =========================
// Public: Exam details
// =========================
router.get("/exams/:examId", async (req, res) => {
  try {
    const { examId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(examId)) {
      return res.status(400).json({ message: "Invalid examId." });
    }

    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    return res.status(200).json({ exam });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error fetching exam." });
  }
});

// =====================================
// Student: Submit exam -> Score + Save
// =====================================
router.post("/exams/:examId/submit", attachUser, requireStudent, async (req, res) => {
  try {
    const { examId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(examId)) {
      return res.status(400).json({ message: "Invalid examId." });
    }

    const { answers } = req.body || {};
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "answers[] is required." });
    }

    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    const totalQuestions = Array.isArray(exam.questions) ? exam.questions.length : 0;
    if (totalQuestions === 0) {
      return res.status(400).json({ message: "Exam has no questions." });
    }

    const marksPerQuestion = exam.totalMarks / totalQuestions;

    const answerMap = new Map();
    for (const a of answers) {
      if (typeof a?.questionIndex !== "number") continue;
      answerMap.set(a.questionIndex, a?.selectedOption ?? "");
    }

    let correctCount = 0;
    const computedAnswers = exam.questions.map((q, idx) => {
      const selectedOption = answerMap.get(idx) ?? "";
      const isCorrect = selectedOption === q.correctAnswer;
      if (isCorrect) correctCount += 1;
      return { questionIndex: idx, selectedOption, isCorrect };
    });

    const rawScore = correctCount * marksPerQuestion;
    const score = Math.round(rawScore * 100) / 100;

    const performance = await Performance.create({
      student: req.user._id,
      exam: exam._id,
      score,
      totalMarks: exam.totalMarks,
      status: "Completed",
      answers: computedAnswers,
    });

    return res.status(201).json({
      message: "Exam submitted successfully.",
      score: performance.score,
      totalMarks: performance.totalMarks,
      performanceId: performance._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error submitting exam." });
  }
});

// =====================================
// Student: Performance dashboard charts
// =====================================
router.get("/performance/dashboard", attachUser, requireStudent, async (req, res) => {
  try {
    const studentId = req.user._id;

    const match = { student: studentId };

    const bySemesterRaw = await Performance.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam",
        },
      },
      { $unwind: "$exam" },
      {
        $addFields: {
          scorePercent: {
            $cond: [
              { $gt: ["$totalMarks", 0] },
              { $multiply: [{ $divide: ["$score", "$totalMarks"] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$exam.semester",
          avgPercentage: { $avg: "$scorePercent" },
          attemptCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0, semester: "$_id", avgPercentage: 1, attemptCount: 1 } },
      { $sort: { semester: 1 } },
    ]);

    const bySemester = bySemesterRaw.map((r) => ({
      semester: Number(r.semester),
      avgPercentage: Math.round((Number(r.avgPercentage) || 0) * 100) / 100,
      attemptCount: Number(r.attemptCount || 0),
    }));

    const subjectRaw = await Performance.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam",
        },
      },
      { $unwind: "$exam" },
      {
        $addFields: {
          scorePercent: {
            $cond: [
              { $gt: ["$totalMarks", 0] },
              { $multiply: [{ $divide: ["$score", "$totalMarks"] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$exam.subject",
          avgPercentage: { $avg: "$scorePercent" },
          attemptCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          subject: "$_id",
          avgPercentage: 1,
          attemptCount: 1,
        },
      },
    ]);

    const subjectPerformance = subjectRaw
      .map((r) => ({
        subject: r.subject,
        avgPercentage: Math.round((Number(r.avgPercentage) || 0) * 100) / 100,
        attemptCount: Number(r.attemptCount || 0),
      }))
      .sort((a, b) => b.attemptCount - a.attemptCount);

    const overall = await Performance.aggregate([
      { $match: match },
      {
        $addFields: {
          scorePercent: {
            $cond: [
              { $gt: ["$totalMarks", 0] },
              { $multiply: [{ $divide: ["$score", "$totalMarks"] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: "$scorePercent" },
          attemptCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0, avgPercentage: 1, attemptCount: 1 } },
    ]);

    const overallAvg = overall[0]?.avgPercentage || 0;

    const cap100 = (n) => Math.max(0, Math.min(100, n));

    const topSkills = [...subjectPerformance]
      .sort((a, b) => b.avgPercentage - a.avgPercentage || b.attemptCount - a.attemptCount)
      .slice(0, 5)
      .map((s) => ({ name: String(s.subject).slice(0, 14), value: cap100(s.avgPercentage) }));

    return res.status(200).json({
      overall: {
        avgPercentage: Math.round(Number(overallAvg) * 100) / 100,
        attemptCount: Number(overall[0]?.attemptCount || 0),
      },
      bySemester,
      skillRadar: topSkills,
      subjectPerformance,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error fetching performance dashboard." });
  }
});

module.exports = router;
