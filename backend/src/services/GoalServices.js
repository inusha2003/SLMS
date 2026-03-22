import Goal from "../models/GoalModel.js";
import { awardBadge } from "./BadgeServices.js";
import { createNotification } from "./NotificationServices.js";

export const createGoal = async (data) => {
    return await Goal.create(data);
};

export const getStudentGoals = async (studentId) => {
    return await Goal.find({ studentId }).sort({ createdAt: -1 });
};

export const updateGoalProgress = async (id, currentVal) => {
    const goal = await Goal.findById(id);
    if (!goal) throw new Error("Goal not found");

    goal.currentValue = currentVal;
    goal.progressPercent = Math.min(
        100,
        Math.round((currentVal / goal.targetValue) * 100)
    );
    goal.lastUpdatedAt = new Date();

    // If achieved
    if (goal.progressPercent >= 100 && goal.status !== "ACHIEVED") {
        goal.status = "ACHIEVED";
        goal.achievedAt = new Date();

        await createNotification({
            studentId: goal.studentId,
            title: "🎉 Goal Achieved!",
            message: `You have successfully achieved your goal: ${goal.title}`,
            type: "ACHIEVEMENT",
        });
    }

    await goal.save();

    // Award badges based on milestones
    if (goal.progressPercent >= 50) {
        await awardBadge(goal.studentId, goal._id, "BRONZE", goal.title);
    }
    if (goal.progressPercent >= 75) {
        await awardBadge(goal.studentId, goal._id, "SILVER", goal.title);
    }
    if (goal.progressPercent >= 100) {
        await awardBadge(goal.studentId, goal._id, "GOLD", goal.title);
    }

    return goal;
};

export const deleteGoal = async (id) => {
    return await Goal.findByIdAndDelete(id);
};

export const syncGoalsFromPerformance = async (performance) => {
    // Find Goals for that student where type=SUBJECT_MARK and type=GPA
    const queries = [
        {
            studentId: performance.studentId,
            type: "SUBJECT_MARK",
            subject: performance.subject,
            $or: [
                { semester: null },
                { semester: { $exists: false } }, // Ensure handles strictly missing
                { semester: performance.semester },
            ],
            $or: [
                { academicYear: null },
                { academicYear: { $exists: false } },
                { academicYear: performance.academicYear },
            ],
        },
    ];

    if (performance.gpa !== undefined && performance.gpa !== null) {
        queries.push({
            studentId: performance.studentId,
            type: "GPA",
            $or: [
                { semester: null },
                { semester: { $exists: false } },
                { semester: performance.semester },
            ],
            $or: [
                { academicYear: null },
                { academicYear: { $exists: false } },
                { academicYear: performance.academicYear },
            ],
        });
    }

    const goalsToUpdate = await Goal.find({ $or: queries });

    for (const goal of goalsToUpdate) {
        let newVal = goal.currentValue;
        if (goal.type === "SUBJECT_MARK") {
            newVal = performance.mark;
        } else if (goal.type === "GPA") {
            newVal = performance.gpa;
        }
        await updateGoalProgress(goal._id, newVal);
    }
};
