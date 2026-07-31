import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  subscribeNewsletter,
  unsubscribeNewsletter,
  getNewsletterStats,
} from '../controllers/notifications';

const router = Router();

// Protected notification routes
router.get('/', authMiddleware, getNotifications);
router.post('/:notificationId/read', authMiddleware, markNotificationRead);
router.post('/mark-all-read', authMiddleware, markAllRead);
router.delete('/:notificationId', authMiddleware, deleteNotification);

// Newsletter routes (public)
router.post('/newsletter/subscribe', subscribeNewsletter);
router.post('/newsletter/unsubscribe', unsubscribeNewsletter);

// Admin newsletter stats
router.get('/newsletter/stats', authMiddleware, requireRole('admin'), getNewsletterStats);

export default router;
