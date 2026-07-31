import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  createComment,
  getArticleComments,
  getComment,
  deleteComment,
  likeComment,
  moderateComment,
  getPendingComments,
} from '../controllers/comments';

const router = Router();

// Public routes
router.get('/article/:articleId', getArticleComments);
router.get('/:commentId', getComment);

// Protected routes
router.post('/', authMiddleware, createComment);
router.delete('/:commentId', authMiddleware, deleteComment);
router.post('/:commentId/like', authMiddleware, likeComment);

// Moderator routes
router.get('/moderation/pending', authMiddleware, requireRole('moderator', 'admin'), getPendingComments);
router.post('/:commentId/moderate', authMiddleware, requireRole('moderator', 'admin'), moderateComment);

export default router;
