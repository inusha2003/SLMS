import 'dotenv/config'; // පළවෙනි පේළියේම තියෙන්න ඕනේ
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import qaRoutes from './routes/qaRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Database Connection Function
async function connectDatabase() {
  const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : null;
  
  if (!uri) {
    console.error("❌ Error: MONGO_URI is not defined in .env file!");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
}

// Global Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(express.json()); // Body parser

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
});
app.use(limiter);

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://[::1]:5173',
      'http://[::1]:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin) || !isProduction) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);

// Member 2 - Notes & Engagement Routes
app.use('/api/notes', noteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/moderation', moderationRoutes);

// Health Check Route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Smart LMS API is running' });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Server Initialization
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  });
});