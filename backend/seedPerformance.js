import mongoose from "mongoose";
import dotenv from "dotenv";
import StudentsPerformance from "./src/models/StudentsPerformanceModel.js";

dotenv.config();

const dummyPerformances = [
    { studentId: "STU-001", subject: "Mathematics", mark: 85, semester: "1", academicYear: "2024-2025", gpa: 3.5, average: 75 },
    { studentId: "STU-001", subject: "Physics", mark: 92, semester: "1", academicYear: "2024-2025", gpa: 3.8, average: 70 },
    { studentId: "STU-001", subject: "Computer Science", mark: 98, semester: "1", academicYear: "2024-2025", gpa: 4.0, average: 80 },
    { studentId: "STU-001", subject: "Chemistry", mark: 65, semester: "1", academicYear: "2024-2025", gpa: 2.5, average: 60 },
    { studentId: "STU-001", subject: "English", mark: 45, semester: "1", academicYear: "2024-2025", gpa: 1.5, average: 65 }
];

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB");
        await StudentsPerformance.deleteMany({ studentId: "STU-001" });
        await StudentsPerformance.insertMany(dummyPerformances);
        console.log("Dummy data inserted successfully");
        mongoose.disconnect();
    })
    .catch(err => {
        console.error("Error connecting to MongoDB", err);
    });
