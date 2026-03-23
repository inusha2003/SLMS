import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { adminOnly, adminOrStudent } from '../middlewares/rbacMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  reviewNote,
  getPendingNotes,
  getMyNotes,
} from '../controllers/noteController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/my', getMyNotes); // Student: own notes
router.get('/pending', adminOnly, getPendingNotes); // Admin only
router.get('/', adminOrStudent, getNotes);
router.get('/:id', adminOrStudent, getNoteById);
router.post('/', adminOrStudent, upload.single('file'), createNote);
router.put('/:id', adminOrStudent, upload.single('file'), updateNote);
router.delete('/:id', adminOrStudent, deleteNote);
router.patch('/:id/review', adminOnly, reviewNote); // Admin: approve/reject

export default router;