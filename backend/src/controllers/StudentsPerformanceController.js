import * as StudentsPerformanceServices from "../services/StudentsPerformanceServices.js";

export const createPerformance = async (req, res) => {
    try {
        const performance = await StudentsPerformanceServices.createPerformance(req.body);
        res.status(201).json(performance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updatePerformance = async (req, res) => {
    try {
        const { id } = req.params;
        const performance = await StudentsPerformanceServices.updatePerformance(id, req.body);
        if (!performance) return res.status(404).json({ message: "Performance record not found" });
        res.status(200).json(performance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getStudentPerformance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, academicYear } = req.query;
        const performances = await StudentsPerformanceServices.getStudentPerformance(
            studentId,
            semester,
            academicYear
        );
        res.status(200).json(performances);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDashboardData = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, academicYear } = req.query;
        const dashboardData = await StudentsPerformanceServices.getDashboardData(
            studentId,
            semester,
            academicYear
        );
        res.status(200).json(dashboardData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
