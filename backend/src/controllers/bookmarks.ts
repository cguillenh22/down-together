import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const createBookmarkSchema = z.object({
  article_id: z.string(),
  article_title: z.string(),
  article_url: z.string().url(),
});

const syncBookmarksSchema = z.object({
  article_ids: z.array(z.string()),
});

export async function createBookmark(req: AuthRequest, res: Response) {
  try {
    const parsed = createBookmarkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { article_id, article_title, article_url } = parsed.data;

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId: req.user!.id,
          articleId: article_id,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Already bookmarked' });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: req.user!.id,
        articleId: article_id,
        articleTitle: article_title,
        articleUrl: article_url,
      },
    });

    res.status(201).json({
      id: bookmark.id,
      user_id: bookmark.userId,
      article_id: bookmark.articleId,
      article_title: bookmark.articleTitle,
      article_url: bookmark.articleUrl,
      created_at: bookmark.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json({ error: 'Failed to create bookmark' });
  }
}

export async function getUserBookmarks(req: AuthRequest, res: Response) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.bookmark.count({
      where: { userId: req.user!.id },
    });

    res.json({
      bookmarks: bookmarks.map(b => ({
        id: b.id,
        user_id: b.userId,
        article_id: b.articleId,
        article_title: b.articleTitle,
        article_url: b.articleUrl,
        created_at: b.createdAt.toISOString(),
      })),
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total,
      },
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
}

export async function getBookmark(req: AuthRequest, res: Response) {
  try {
    const { bookmarkId } = req.params;

    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Check ownership
    if (bookmark.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
      id: bookmark.id,
      user_id: bookmark.userId,
      article_id: bookmark.articleId,
      article_title: bookmark.articleTitle,
      article_url: bookmark.articleUrl,
      created_at: bookmark.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Get bookmark error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmark' });
  }
}

export async function deleteBookmark(req: AuthRequest, res: Response) {
  try {
    const { bookmarkId } = req.params;

    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Check ownership
    if (bookmark.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.bookmark.delete({
      where: { id: bookmarkId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
}

export async function syncBookmarks(req: AuthRequest, res: Response) {
  try {
    const parsed = syncBookmarksSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { article_ids } = parsed.data;

    // Get existing bookmarks for user
    const existing = await prisma.bookmark.findMany({
      where: { userId: req.user!.id },
      select: { articleId: true },
    });

    const existingIds = new Set(existing.map(b => b.articleId));

    // Find articles to create
    const toCreate = article_ids.filter(id => !existingIds.has(id));

    if (toCreate.length === 0) {
      return res.json({ synced: 0, message: 'All bookmarks already exist' });
    }

    // For MVP, we need article data from somewhere
    // In production, fetch from articles table
    // For now, we'll create with placeholder data
    // Frontend should provide article_title and article_url in sync payload

    // Better approach: require article metadata in sync request
    return res.status(400).json({
      error: 'Sync requires article_title and article_url for new bookmarks',
      hint: 'Send array of objects: [{article_id, article_title, article_url}]',
    });
  } catch (error) {
    console.error('Sync bookmarks error:', error);
    res.status(500).json({ error: 'Failed to sync bookmarks' });
  }
}

export async function syncBookmarksWithData(req: AuthRequest, res: Response) {
  try {
    const { bookmarks } = req.body;

    if (!Array.isArray(bookmarks)) {
      return res.status(400).json({ error: 'Expected array of bookmarks' });
    }

    // Validate each bookmark
    const validated = bookmarks.every(b =>
      b.article_id && b.article_title && b.article_url
    );

    if (!validated) {
      return res.status(400).json({ error: 'Each bookmark needs article_id, article_title, article_url' });
    }

    // Get existing bookmarks
    const existing = await prisma.bookmark.findMany({
      where: { userId: req.user!.id },
      select: { articleId: true },
    });

    const existingIds = new Set(existing.map(b => b.articleId));

    // Create only new bookmarks
    const toCreate = bookmarks.filter((b: any) => !existingIds.has(b.article_id));

    const created = await prisma.bookmark.createMany({
      data: toCreate.map((b: any) => ({
        userId: req.user!.id,
        articleId: b.article_id,
        articleTitle: b.article_title,
        articleUrl: b.article_url,
      })),
    });

    res.json({
      synced: created.count,
      existing: existingIds.size,
      total: existingIds.size + created.count,
    });
  } catch (error) {
    console.error('Sync bookmarks with data error:', error);
    res.status(500).json({ error: 'Failed to sync bookmarks' });
  }
}

export async function checkBookmarked(req: AuthRequest, res: Response) {
  try {
    const { article_id } = req.query;

    if (!article_id) {
      return res.status(400).json({ error: 'Missing article_id' });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId: req.user!.id,
          articleId: article_id as string,
        },
      },
    });

    res.json({
      bookmarked: !!bookmark,
      bookmark_id: bookmark?.id,
    });
  } catch (error) {
    console.error('Check bookmarked error:', error);
    res.status(500).json({ error: 'Failed to check bookmark' });
  }
}
