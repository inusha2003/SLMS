import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { adminOrStudent } from '../middlewares/rbacMiddleware.js';
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  toggleLike,
  reportComment,
} from '../controllers/commentController.js';

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);
router.use(adminOrStudent);

router.get('/', getComments);
router.post('/', createComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/like', toggleLike);
router.post('/:id/report', reportComment);

export default router;