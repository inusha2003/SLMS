import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import mongoose from 'mongoose'; // යාලුවාගේ mongoose එක මෙතනට ගත්තා
import { fileURLToPath } from 'url';

// Routes Imports
import noteRoutes from './routes/noteRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import qaRoutes from './routes/qaRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Database Connection Function (යාලුවාගේ කෝඩ් එක ES6 වලට හැදුවා)
async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI is not set. Database connection skipped.");
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// 2. Middleware Setup
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Routes
app.use('/api/notes', noteRoutes);
app.use('/api/notes/:noteId/comments', commentRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/moderation', moderationRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 4. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 20MB' });
  }
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// 5. Server Start logic (යාලුවාගේ පියවර අනුගමනය කරමින්)
const PORT = process.env.PORT || 5000;

connectDatabase().then(() => {
  app.listen(PORT, () => {
    const base = `http://localhost:${PORT}`;
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔗 Health Check: ${base}/api/health`);
    console.log(`📂 Notes API:   ${base}/api/notes`);
  });
});