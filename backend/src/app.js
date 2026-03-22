const express = require("express");
const cors = require("cors");

const contentRoutes = require("./routes/contentRoutes.jsx");
const assessmentRoutes = require("./routes/assessmentRoutes.jsx");
const flashcardRoutes = require("./routes/flashcardRoutes.jsx");
const mcqBankRoutes = require("./routes/mcqBankRoutes.jsx");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
  });
});

// API routes
app.use("/api/content", contentRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/flashcards", flashcardRoutes);

// MCQ bank: app-level GET so /api/mcq-bank always matches (Express 5 + Postman/browser)
app.get("/api/mcq-bank", mcqBankRoutes.listUpcomingMcqSets);
app.get("/api/mcq-bank/", mcqBankRoutes.listUpcomingMcqSets);
app.use("/api/mcq-bank", mcqBankRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    method: req.method,
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;
