import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Routes
import noteRoutes from './routes/noteRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import qaRoutes from './routes/qaRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import assessmentPerformanceRoutes from './routes/assessmentPerformanceRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// DB connect
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Middleware
app.use(helmet());
app.use(morgan('dev'));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
}));

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
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In dev, allow any origin to avoid "Network Error" from devtools/Vite origin variations.
      if (!isProduction) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assessment', assessmentPerformanceRoutes);

app.use('/api/notes', noteRoutes);
app.use('/api/notes/:noteId/comments', commentRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/moderation', moderationRoutes);

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});