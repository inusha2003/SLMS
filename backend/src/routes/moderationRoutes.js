import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/rbacMiddleware.js';
import {
  getReports,
  reviewReport,
  deleteReportedContent,
  getModerationLogs,
  getFlaggedNotes,
  warnUser,
  getDashboardStats,
} from '../controllers/moderationController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

router.get('/stats', getDashboardStats);
router.get('/reports', getReports);
router.patch('/reports/:id', reviewReport);
router.delete('/content', deleteReportedContent);
router.get('/logs', getModerationLogs);
router.get('/flagged-notes', getFlaggedNotes);
router.post('/warn', warnUser);

export default router;