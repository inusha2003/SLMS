import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController.js';

const router = Router();

router.get('/', protect, getTasks);
router.post('/', protect, createTask);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

export default router;
