import express from "express";
import * as StudentsPerformanceController from "../controllers/StudentsPerformanceController.js";

const router = express.Router();

router.post("/", StudentsPerformanceController.createPerformance);
router.put("/:id", StudentsPerformanceController.updatePerformance);
router.get("/student/:studentId", StudentsPerformanceController.getStudentPerformance);
router.get("/dashboard/:studentId", StudentsPerformanceController.getDashboardData);

export default router;
