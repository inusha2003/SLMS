import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
    {
        studentId: { type: String, required: true },
        title: { type: String, required: true },
        type: {
            type: String,
            enum: ["SUBJECT_MARK", "GPA", "WEEKLY_TARGET"],
            required: true,
        },
        targetValue: { type: Number, required: true },
        currentValue: { type: Number, default: 0 },
        subject: {
            type: String,
            // Required only if type is SUBJECT_MARK
            required: function () {
                return this.type === "SUBJECT_MARK";
            },
            default: null,
        },
        semester: { type: String, default: null },
        academicYear: { type: String, default: null },
        status: {
            type: String,
            enum: ["ACTIVE", "ACHIEVED", "EXPIRED"],
            default: "ACTIVE",
        },
        progressPercent: { type: Number, default: 0 },
        achievedAt: { type: Date, default: null },
        lastUpdatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);
