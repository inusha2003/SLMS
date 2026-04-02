import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import StudentsPerformance from "../models/StudentsPerformanceModel.js";

const router = Router();

function cap100(n) {
  const x = Number(n) || 0;
  return Math.max(0, Math.min(100, x));
}

router.get("/performance/dashboard", protect, async (req, res) => {
  try {
    const studentId = String(req.user?._id || "");
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized: missing user." });
    }

    const match = { studentId };

    const bySemesterRaw = await StudentsPerformance.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$semester",
          avgPercentage: { $avg: "$mark" },
          attemptCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          semester: "$_id",
          avgPercentage: 1,
          attemptCount: 1,
        },
      },
      { $sort: { semester: 1 } },
    ]);

    const bySemester = bySemesterRaw.map((r) => ({
      semester: r.semester,
      avgPercentage: Math.round(cap100(r.avgPercentage) * 100) / 100,
      attemptCount: Number(r.attemptCount || 0),
    }));

    const subjectRaw = await StudentsPerformance.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$subject",
          avgPercentage: { $avg: "$mark" },
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
        avgPercentage: Math.round(cap100(r.avgPercentage) * 100) / 100,
        attemptCount: Number(r.attemptCount || 0),
      }))
      .sort((a, b) => b.attemptCount - a.attemptCount);

    const overallAgg = await StudentsPerformance.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: "$mark" },
          attemptCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0, avgPercentage: 1, attemptCount: 1 } },
    ]);

    const overallAvg = overallAgg[0]?.avgPercentage || 0;

    const skillRadar = [...subjectPerformance]
      .sort(
        (a, b) =>
          b.avgPercentage - a.avgPercentage || b.attemptCount - a.attemptCount,
      )
      .slice(0, 5)
      .map((s) => ({
        name: String(s.subject || "—").slice(0, 14),
        value: cap100(s.avgPercentage),
      }));

    return res.status(200).json({
      overall: {
        avgPercentage: Math.round(cap100(overallAvg) * 100) / 100,
        attemptCount: Number(overallAgg[0]?.attemptCount || 0),
      },
      bySemester,
      skillRadar,
      subjectPerformance,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res
      .status(500)
      .json({ message: "Server error fetching performance dashboard." });
  }
});

export default router;

