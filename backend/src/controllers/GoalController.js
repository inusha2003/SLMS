import * as GoalServices from "../services/GoalServices.js";
import * as BadgeServices from "../services/BadgeServices.js";

export const createGoal = async (req, res) => {
    try {
        const goal = await GoalServices.createGoal(req.body);
        res.status(201).json(goal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getStudentGoals = async (req, res) => {
    try {
        const { studentId } = req.params;
        const goals = await GoalServices.getStudentGoals(studentId);
        res.status(200).json(goals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateGoalProgress = async (req, res) => {
    try {
        const { goalId } = req.params;
        const { currentValue } = req.body;
        const goal = await GoalServices.updateGoalProgress(goalId, currentValue);
        res.status(200).json(goal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteGoal = async (req, res) => {
    try {
        const { goalId } = req.params;
        const goal = await GoalServices.deleteGoal(goalId);
        if (!goal) return res.status(404).json({ message: "Goal not found" });
        res.status(200).json({ message: "Goal deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStudentBadges = async (req, res) => {
    try {
        const { studentId } = req.params;
        const badges = await BadgeServices.getStudentBadges(studentId);
        res.status(200).json(badges);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
