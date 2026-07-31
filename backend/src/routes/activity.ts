import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  trackActivity,
  getUserActivity,
  getAnalytics,
  getEngagementMetrics,
} from '../controllers/activity';

const router = Router();

// User activity tracking
router.post('/', authMiddleware, trackActivity);
router.get('/', authMiddleware, getUserActivity);

// Analytics (admin only)
router.get('/analytics/overview', authMiddleware, requireRole('admin'), getAnalytics);
router.get('/analytics/engagement', authMiddleware, requireRole('admin'), getEngagementMetrics);

export default router;
