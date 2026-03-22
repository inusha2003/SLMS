import express from "express";
import * as GoalController from "../controllers/GoalController.js";

const router = express.Router();

router.post("/", GoalController.createGoal);
router.get("/student/:studentId", GoalController.getStudentGoals);
router.patch("/:goalId/progress", GoalController.updateGoalProgress);
router.delete("/:goalId", GoalController.deleteGoal);
router.get("/student/:studentId/badges", GoalController.getStudentBadges);

export default router;
