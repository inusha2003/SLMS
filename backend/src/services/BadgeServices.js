import Badge from "../models/BadgeModel.js";
import { createNotification } from "./NotificationServices.js";

export const awardBadge = async (studentId, goalId, badgeType, goalTitle) => {
    try {
        const badge = await Badge.create({ studentId, goalId, badgeType });

        // When a badge is awarded, create an ACHIEVEMENT notification
        await createNotification({
            studentId,
            title: "🏅 New Badge Unlocked!",
            message: `You earned the ${badgeType} badge for goal: ${goalTitle}`,
            type: "ACHIEVEMENT",
        });

        return badge;
    } catch (err) {
        // Error code 11000 means a unique constraint violation (duplicate key)
        // We can safely ignore it, as it means the badge was already awarded
        if (err.code === 11000) {
            return await Badge.findOne({ studentId, goalId, badgeType });
        }
        throw err;
    }
};

export const getStudentBadges = async (studentId) => {
    return await Badge.find({ studentId })
        .populate("goalId", "title type")
        .sort({ awardedAt: -1 });
};
