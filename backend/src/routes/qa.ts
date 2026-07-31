import { Router } from 'express';
import { authMiddleware, requireRole, optionalAuth } from '../middleware/auth';
import {
  createQA,
  getAllQA,
  getQA,
  updateQA,
  publishQA,
  markHelpful,
  getExpertQA,
  getMyDrafts,
} from '../controllers/qa';

const router = Router();

// Public routes
router.get('/', optionalAuth, getAllQA);
router.get('/:qaId', optionalAuth, getQA);
router.get('/expert/:expertId', getExpertQA);

// Protected routes (experts only)
router.post('/', authMiddleware, requireRole('expert'), createQA);
router.patch('/:qaId', authMiddleware, updateQA);
router.post('/:qaId/publish', authMiddleware, publishQA);
router.post('/:qaId/helpful', authMiddleware, markHelpful);
router.get('/my/drafts', authMiddleware, getMyDrafts);

export default router;
