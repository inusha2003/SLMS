import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { adminOrStudent } from '../middlewares/rbacMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  upvoteQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  upvoteAnswer,
  acceptAnswer,
  reportContent,
} from '../controllers/qaController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOrStudent);

router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestionById);
router.post('/questions', upload.single('file'), createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/questions/:id/upvote', upvoteQuestion);
router.post('/questions/:questionId/answers', createAnswer);
router.put('/answers/:id', updateAnswer);
router.delete('/answers/:id', deleteAnswer);
router.post('/answers/:id/upvote', upvoteAnswer);
router.post('/questions/:questionId/answers/:answerId/accept', acceptAnswer);
router.post('/report', reportContent);

export default router;