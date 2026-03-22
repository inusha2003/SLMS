import express from "express";
import * as CalendarEventController from "../controllers/CalendarEventController.js";

const router = express.Router();

router.post("/", CalendarEventController.createCalendarEvent);
router.get("/student/:studentId", CalendarEventController.getStudentEvents);
router.put("/:id", CalendarEventController.updateCalendarEvent);
router.delete("/:id", CalendarEventController.deleteCalendarEvent);

export default router;
