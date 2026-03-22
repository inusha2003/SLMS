import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
    {
        studentId: { type: String, required: true },
        goalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Goal",
            required: true,
        },
        badgeType: {
            type: String,
            enum: ["BRONZE", "SILVER", "GOLD"],
            required: true,
        },
        awardedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Prevent duplicate badges per student/goal/type
badgeSchema.index({ studentId: 1, goalId: 1, badgeType: 1 }, { unique: true });

export default mongoose.model("Badge", badgeSchema);
