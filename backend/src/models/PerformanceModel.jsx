const mongoose = require("mongoose");

const { Schema } = mongoose;

const performanceAnswerSchema = new Schema(
  {
    questionIndex: { type: Number, required: true, min: 0 },
    selectedOption: { type: String, default: "" },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const performanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    score: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Completed"], default: "Completed" },
    answers: { type: [performanceAnswerSchema], default: [] },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Performance", performanceSchema);
