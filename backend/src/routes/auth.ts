import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { register, login, refresh, logout, verifyEmail } from '../controllers/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/verify-email', verifyEmail);

// Protected routes
router.post('/logout', authMiddleware, logout);

export default router;
