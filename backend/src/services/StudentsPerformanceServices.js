import StudentsPerformance from "../models/StudentsPerformanceModel.js";
import { syncGoalsFromPerformance } from "./GoalServices.js";
import { createNotification } from "./NotificationServices.js";

export const createPerformance = async (data) => {
    const performance = await StudentsPerformance.create(data);
    await handlePostPerformanceSave(performance);
    return performance;
};

export const updatePerformance = async (id, data) => {
    const performance = await StudentsPerformance.findByIdAndUpdate(id, data, { new: true });
    if (performance) {
        await handlePostPerformanceSave(performance);
    }
    return performance;
};

export const getStudentPerformance = async (studentId, semester, academicYear) => {
    const query = { studentId };
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    return await StudentsPerformance.find(query).sort({ createdAt: -1 });
};

export const getDashboardData = async (studentId, semester, academicYear) => {
    const query = { studentId };
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    const performances = await StudentsPerformance.find(query);

    const subjectWise = performances.map((p) => ({
        subject: p.subject,
        mark: p.mark,
    }));

    const totalMarks = subjectWise.reduce((sum, item) => sum + item.mark, 0);
    const averageMark = performances.length > 0 ? (totalMarks / performances.length).toFixed(2) : 0;

    let gpa = null;
    const withGpa = performances.find((p) => p.gpa !== undefined && p.gpa !== null);
    if (withGpa) {
        gpa = withGpa.gpa;
    }

    const chartData = {
        labels: performances.map((p) => p.subject),
        values: performances.map((p) => p.mark),
    };

    return {
        subjectWise,
        averageMark: parseFloat(averageMark),
        gpa,
        chartData: chartData,
    };
};

const handlePostPerformanceSave = async (performance) => {
    // Low performance alert
    if (performance.mark < 40) {
        await createNotification({
            studentId: performance.studentId,
            title: "Warning: Low Performance",
            message: `Your mark for ${performance.subject} is below the 40 threshold (${performance.mark}). Keep pushing!`,
            type: "WARNING",
        });
    }

    // Trigger auto-sync for goals and badges
    await syncGoalsFromPerformance(performance);
};
