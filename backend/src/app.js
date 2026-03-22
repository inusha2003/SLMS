import express from "express";
import cors from "cors";

import goalRoutes from "./routes/GoalRoutes.js";
import notificationRoutes from "./routes/NotificationRoutes.js";
import calendarRoutes from "./routes/CalendarEventRoutes.js";
import performanceRoutes from "./routes/StudentsPerformanceRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/goals", goalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/performance", performanceRoutes);

app.get("/", (req, res) => {
    res.send("Backend app running successfully");
});

export default app;
