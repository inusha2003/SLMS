const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const Exam = require("../models/ExamModel.jsx");
const Performance = require("../models/PerformanceModel.jsx");

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
  if (!userId || !/^[a-fA-F0-9]{24}$/.test(userId)) return null;
  const User = await loadMainUserModel();
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

function buildScheduledDate(dateValue, timeValue) {
  if (!dateValue) return undefined;
  const dateOnly = String(dateValue).trim();
  if (!dateOnly) return undefined;
  const timeOnly = String(timeValue || "09:00").trim() || "09:00";
  const combined = new Date(`${dateOnly}T${timeOnly}:00`);
  if (Number.isNaN(combined.getTime())) return undefined;
  return combined;
}

function isPastCalendarDate(dateValue) {
  if (!dateValue) return false;

  const parsed = new Date(`${String(dateValue).trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  return parsed.getTime() < today.getTime();
}

function getComputedStatus(exam) {
  return exam?.status === "Completed" ? "Completed" : "Upcoming";
}

function hasExamStarted(exam) {
  if (!exam?.scheduledAt) return true;
  const when = new Date(exam.scheduledAt);
  if (Number.isNaN(when.getTime())) return true;
  return when.getTime() <= Date.now();
}

function sanitizeExamForStudent(exam) {
  return {
    ...exam,
    status: getComputedStatus(exam),
    questions: Array.isArray(exam?.questions)
      ? exam.questions.map((q) => ({
          question: q.question,
          options: q.options,
        }))
      : [],
  };
}

function summarizeExam(exam, extras = {}) {
  return {
    _id: exam._id,
    kind: exam.kind || "exam",
    title: exam.title,
    subject: exam.subject,
    semester: exam.semester,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    scheduledAt: exam.scheduledAt || null,
    startTime: exam.startTime || "09:00",
    status: getComputedStatus(exam),
    questionCount: Array.isArray(exam.questions) ? exam.questions.length : 0,
    createdAt: exam.createdAt,
    ...extras,
  };
}

function sanitizeQuestions(questions = []) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return null;
  }

  const sanitizedQuestions = questions.map((q) => {
    const options = Array.isArray(q?.options)
      ? q.options.map((o) => String(o || "").trim())
      : [];
    const correctAnswer = String(q?.correctAnswer || "").trim();

    if (
      !String(q?.question || "").trim() ||
      options.length !== 4 ||
      options.some((o) => !o) ||
      !correctAnswer ||
      !options.includes(correctAnswer)
    ) {
      return null;
    }

    return {
      question: String(q.question).trim(),
      options,
      correctAnswer,
      explanation: q?.explanation ? String(q.explanation).trim() : "",
    };
  });

  if (sanitizedQuestions.some((q) => q === null)) {
    return null;
  }

  return sanitizedQuestions;
}

function isFourthYearSemester(semesterValue) {
  const semesterNumber = Number(semesterValue);
  return Number.isFinite(semesterNumber) && semesterNumber >= 7;
}

function canStudentAccessExam(student, exam) {
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

router.get("/", (req, res) => {
  res.status(200).json({ message: "Assessment API is working" });
});

router.post("/exams", attachUser, requireAdmin, async (req, res) => {
  try {
    const {
      kind,
      title,
      subject,
      semester,
      duration,
      totalMarks,
      questions = [],
      examDate,
      startTime,
      scheduledAt,
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

    if ((kind === "mcq_bank" ? "mcq_bank" : "exam") === "exam" && isPastCalendarDate(examDate)) {
      return res.status(400).json({
        message: "Exam date cannot be in the past.",
      });
    }

    const sanitizedQuestions = sanitizeQuestions(questions);
    if (!sanitizedQuestions) {
      return res.status(400).json({ message: "Invalid questions payload." });
    }

    const exactSchedule =
      buildScheduledDate(examDate, startTime) ||
      (scheduledAt ? new Date(scheduledAt) : undefined);

    const examPayload = {
      kind: kind === "mcq_bank" ? "mcq_bank" : "exam",
      title: String(title).trim(),
      subject: String(subject).trim(),
      semester: Number(semester),
      duration: Number(duration),
      totalMarks: Number(totalMarks),
      questions: sanitizedQuestions,
      createdBy: req.user._id,
      status: "Upcoming",
      startTime: String(startTime || "09:00").trim() || "09:00",
    };

    if (exactSchedule && !Number.isNaN(exactSchedule.getTime())) {
      examPayload.scheduledAt = exactSchedule;
    }

    const createdExam = await Exam.create(examPayload);

    return res.status(201).json({
      message: "Exam created",
      exam: summarizeExam(createdExam.toObject()),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error creating exam." });
  }
});

router.get("/exams", attachUser, async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { kind: "exam" };
    if (req.user?.role === "Student" && req.user?.semester && !isFourthYearSemester(req.user.semester)) {
      filter.semester = { $lte: Number(req.user.semester) };
    }

    const exams = await Exam.find(filter)
      .sort({ scheduledAt: 1, createdAt: -1 })
      .lean();

    const examIds = exams.map((e) => e._id);
    let attemptMap = {};
    let viewerPerformanceMap = {};

    if (examIds.length > 0) {
      const attemptAgg = await Performance.aggregate([
        { $match: { exam: { $in: examIds } } },
        { $group: { _id: "$exam", attemptCount: { $sum: 1 } } },
      ]);
      attemptMap = Object.fromEntries(
        attemptAgg.map((row) => [String(row._id), Number(row.attemptCount || 0)])
      );

      if (req.user?.role === "Student") {
        const viewerRows = await Performance.find({
          exam: { $in: examIds },
          student: req.user._id,
        })
          .select("exam score totalMarks submittedAt")
          .lean();

        viewerPerformanceMap = Object.fromEntries(
          viewerRows.map((row) => [
            String(row.exam),
            {
              score: row.score,
              totalMarks: row.totalMarks,
              submittedAt: row.submittedAt,
            },
          ])
        );
      }
    }

    const examsWithMeta = exams
      .map((exam) => {
        const viewerSubmission = viewerPerformanceMap[String(exam._id)] || null;
        return summarizeExam(exam, {
          attemptCount: attemptMap[String(exam._id)] || 0,
          viewerHasSubmitted: Boolean(viewerSubmission),
          viewerSubmission,
        });
      })
      .filter((exam) => !status || exam.status === status);

    return res.status(200).json({ exams: examsWithMeta });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error fetching exams." });
  }
});

router.patch("/exams/:examId", attachUser, requireAdmin, async (req, res) => {
  try {
    const { examId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(examId)) {
      return res.status(400).json({ message: "Invalid examId." });
    }

    const existingExam = await Exam.findById(examId).lean();
    if (!existingExam) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    const {
      kind,
      title,
      subject,
      semester,
      duration,
      totalMarks,
      questions,
      status,
      scheduledAt,
      examDate,
      startTime,
    } = req.body || {};
    const updates = {};
    const unsets = {};
    const nextKind = kind === "mcq_bank" ? "mcq_bank" : existingExam.kind || "exam";

    if (title != null) {
      const nextTitle = String(title).trim();
      if (!nextTitle) {
        return res.status(400).json({ message: "Title is required." });
      }
      updates.title = nextTitle;
    }

    if (subject != null) {
      const nextSubject = String(subject).trim();
      if (!nextSubject) {
        return res.status(400).json({ message: "Subject is required." });
      }
      updates.subject = nextSubject;
    }

    if (semester != null) {
      const nextSemester = Number(semester);
      if (!Number.isFinite(nextSemester) || nextSemester < 1) {
        return res.status(400).json({ message: "Semester must be a valid number." });
      }
      updates.semester = nextSemester;
    }

    if (duration != null) {
      const nextDuration = Number(duration);
      if (!Number.isFinite(nextDuration) || nextDuration < 1) {
        return res.status(400).json({ message: "Duration must be at least 1 minute." });
      }
      updates.duration = nextDuration;
    }

    if (totalMarks != null) {
      const nextTotalMarks = Number(totalMarks);
      if (!Number.isFinite(nextTotalMarks) || nextTotalMarks < 1) {
        return res.status(400).json({ message: "Total marks must be at least 1." });
      }
      updates.totalMarks = nextTotalMarks;
    }

    if (questions != null) {
      const sanitizedQuestions = sanitizeQuestions(questions);
      if (!sanitizedQuestions) {
        return res.status(400).json({ message: "Invalid questions payload." });
      }
      updates.questions = sanitizedQuestions;
    }

    if (status === "Upcoming" || status === "Completed") {
      updates.status = status;
    }

    const exactSchedule =
      buildScheduledDate(examDate, startTime) ||
      (scheduledAt ? new Date(scheduledAt) : undefined);
    if (nextKind === "exam" && examDate != null && isPastCalendarDate(examDate)) {
      return res.status(400).json({ message: "Exam date cannot be in the past." });
    }
    if (exactSchedule && !Number.isNaN(exactSchedule.getTime())) {
      updates.scheduledAt = exactSchedule;
    } else if (nextKind === "mcq_bank") {
      unsets.scheduledAt = 1;
    }

    if (nextKind === "exam" && startTime != null && String(startTime).trim()) {
      updates.startTime = String(startTime).trim();
    } else if (nextKind === "mcq_bank") {
      updates.startTime = "09:00";
    }

    if (Object.keys(updates).length === 0) {
      if (Object.keys(unsets).length === 0) {
        return res.status(400).json({ message: "No valid fields to update." });
      }
    }

    const updateDoc = {};
    if (Object.keys(updates).length > 0) {
      updateDoc.$set = updates;
    }
    if (Object.keys(unsets).length > 0) {
      updateDoc.$unset = unsets;
    }

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const exam = await Exam.findOneAndUpdate(
      { _id: examId, kind: nextKind },
      updateDoc,
      { new: true }
    ).lean();
    if (!exam) {
      return res.status(404).json({
        message: nextKind === "mcq_bank" ? "MCQ Bank set not found." : "Exam not found.",
      });
    }

    return res.status(200).json({
      message: nextKind === "mcq_bank" ? "MCQ Bank set updated" : "Exam updated",
      exam: summarizeExam(exam),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error updating exam." });
  }
});

router.delete("/exams/:examId", attachUser, requireAdmin, async (req, res) => {
  try {
    const { examId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(examId)) {
      return res.status(400).json({ message: "Invalid examId." });
    }

    const existingExam = await Exam.findById(examId).lean();
    if (!existingExam) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    if (existingExam.kind === "exam") {
      const attemptCount = await Performance.countDocuments({ exam: examId });
      if (attemptCount > 0) {
        return res.status(409).json({
          message: "This exam cannot be deleted because students have already attempted it.",
        });
      }
    }

    const deletedExam = await Exam.findOneAndDelete({
      _id: examId,
      kind: existingExam.kind,
    }).lean();
    if (!deletedExam) {
      return res.status(404).json({
        message: existingExam.kind === "mcq_bank" ? "MCQ Bank set not found." : "Exam not found.",
      });
    }

    return res.status(200).json({
      message:
        existingExam.kind === "mcq_bank"
          ? "MCQ Bank set deleted successfully."
          : "Exam deleted successfully.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error deleting exam." });
  }
});

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

    const exam = await Exam.findOne({ _id: examId, kind: "exam" })
      .select("title subject semester duration totalMarks scheduledAt startTime questions")
      .lean();

    const reviewedAnswers = (performance.answers || []).map((answer) => {
      const question = exam?.questions?.[answer.questionIndex];
      return {
        questionIndex: answer.questionIndex,
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect,
        question: question?.question || "",
        correctAnswer: question?.correctAnswer || "",
        explanation: question?.explanation || "",
      };
    });

    return res.status(200).json({
      performance: {
        ...performance,
        exam,
        reviewedAnswers,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
});

router.get("/exams/:examId", attachUser, async (req, res) => {
  try {
    const { examId } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(examId)) {
      return res.status(400).json({ message: "Invalid examId." });
    }

    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ message: "Assessment not found." });

    if (req.user?.role === "Admin") {
      return res.status(200).json({ exam: { ...exam, status: getComputedStatus(exam) } });
    }

    if (exam.kind !== "exam") {
      return res.status(403).json({
        message: "Students should access MCQ Bank sets from the MCQ Bank page.",
      });
    }

    if (req.user?.role === "Student" && !canStudentAccessExam(req.user, exam)) {
      return res.status(403).json({
        message: "You do not have access to this exam for your current semester.",
      });
    }

    if (req.user?.role === "Student" && !hasExamStarted(exam)) {
      return res.status(403).json({
        message: "This exam is not available yet. Please wait until the scheduled start time.",
      });
    }

    const viewerSubmission =
      req.user?.role === "Student"
        ? await Performance.findOne({
            exam: examId,
            student: req.user._id,
          })
            .select("_id score totalMarks submittedAt")
            .lean()
        : null;

    return res.status(200).json({
      exam: sanitizeExamForStudent(exam),
      viewerHasSubmitted: Boolean(viewerSubmission),
      viewerSubmission: viewerSubmission || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error fetching exam." });
  }
});

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

    const existingAttempt = await Performance.findOne({
      exam: examId,
      student: req.user._id,
    }).lean();
    if (existingAttempt) {
      return res.status(409).json({
        message: "You have already submitted this exam.",
        score: existingAttempt.score,
        totalMarks: existingAttempt.totalMarks,
        performanceId: existingAttempt._id,
      });
    }

    const exam = await Exam.findOne({ _id: examId, kind: "exam" }).lean();
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    if (!canStudentAccessExam(req.user, exam)) {
      return res.status(403).json({
        message: "You do not have access to this exam for your current semester.",
      });
    }

    if (!hasExamStarted(exam)) {
      return res.status(403).json({
        message: "This exam is not available yet. Please wait until the scheduled start time.",
      });
    }

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
