import mongoose from "mongoose";

const studentsPerformanceSchema = new mongoose.Schema(
    {
        studentId: { type: String, required: true },
        subject: { type: String, required: true },
        mark: { type: Number, required: true, min: 0, max: 100 },
        semester: { type: String, required: true },
        academicYear: { type: String, required: true },
        gpa: { type: Number },
        average: { type: Number },
    },
    { timestamps: true }
);

export default mongoose.model("StudentsPerformance", studentsPerformanceSchema);
