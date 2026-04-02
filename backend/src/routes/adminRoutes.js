import { Router } from 'express';
import { getAllUsers, toggleUserStatus } from '../controllers/adminController.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roleCheck.js';

const router = Router();

router.get('/users', protect, authorize('Admin'), getAllUsers);
router.put('/users/:id/toggle', protect, authorize('Admin'), toggleUserStatus);

export default router;