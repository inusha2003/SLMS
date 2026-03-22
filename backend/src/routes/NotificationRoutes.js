import express from "express";
import * as NotificationController from "../controllers/NotificationController.js";

const router = express.Router();

router.get("/student/:studentId", NotificationController.getStudentNotifications);
router.patch("/:id/read", NotificationController.markAsRead);
router.patch("/student/:studentId/read-all", NotificationController.markAllAsRead);

export default router;
