const mongoose = require("mongoose");

const { Schema } = mongoose;

const examQuestionSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: "Each question must have exactly 4 options.",
      },
    },
    correctAnswer: { type: String, required: true, trim: true },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const examSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1 },
    duration: { type: Number, required: true, min: 1 }, // duration in minutes
    totalMarks: { type: Number, required: true, min: 1 },
    questions: { type: [examQuestionSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["Upcoming", "Completed"],
      required: true,
      default: "Upcoming",
    },
    /** Shown on Exam Schedule (date block); defaults to createdAt in UI if missing */
    scheduledAt: { type: Date },
    /** Display e.g. "09:00" on schedule cards */
    startTime: { type: String, default: "09:00", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);

