import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.get('/me', protect, getProfile);
router.put('/update', protect, updateProfile);

export default router;