import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import assessmentPerformanceRoutes from './routes/assessmentPerformanceRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// `override: true` — if the shell/OS has empty JWT_SECRET (or other keys), still use backend/.env
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing. Set it in backend/.env (see .env.example). Login will fail until this is set.');
}

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing. Set it in backend/.env.');
}

function isAllowedDevOrigin(origin) {
  if (!origin) return true;
  try {
    const u = new URL(origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const { hostname } = u;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedDevOrigin(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assessment', assessmentPerformanceRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Smart LMS API is running' });
});

app.use((err, _req, res, _next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start server:', e);
    process.exit(1);
  }
})();