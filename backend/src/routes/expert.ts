import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  requestVerification,
  getPendingRequests,
  approveVerification,
  getVerificationStatus,
} from '../controllers/expert';

const router = Router();

// User routes
router.post('/verify', authMiddleware, requestVerification);
router.get('/verify/status', authMiddleware, getVerificationStatus);

// Admin/moderator routes
router.get('/verify/requests', authMiddleware, requireRole('admin', 'moderator'), getPendingRequests);
router.post('/verify/:requestId/approve', authMiddleware, requireRole('admin'), approveVerification);

export default router;
