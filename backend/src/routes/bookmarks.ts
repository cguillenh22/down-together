import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createBookmark,
  getUserBookmarks,
  getBookmark,
  deleteBookmark,
  syncBookmarksWithData,
  checkBookmarked,
} from '../controllers/bookmarks';

const router = Router();

// All bookmark routes require authentication
router.use(authMiddleware);

// CRUD operations
router.post('/', createBookmark);
router.get('/user', getUserBookmarks);
router.get('/:bookmarkId', getBookmark);
router.delete('/:bookmarkId', deleteBookmark);

// Sync from localStorage on login
router.post('/sync', syncBookmarksWithData);

// Check if article is bookmarked
router.get('/check', checkBookmarked);

export default router;
