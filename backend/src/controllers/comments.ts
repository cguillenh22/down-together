import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, requireRole } from '../middleware/auth';

const prisma = new PrismaClient();

const createCommentSchema = z.object({
  article_id: z.string(),
  content: z.string().min(1).max(5000),
  parent_comment_id: z.string().optional(),
});

const moderateCommentSchema = z.object({
  action: z.enum(['approved', 'rejected', 'flagged', 'removed']),
  reason: z.string().optional(),
});

export async function createComment(req: AuthRequest, res: Response) {
  try {
    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { article_id, content, parent_comment_id } = parsed.data;

    const comment = await prisma.comment.create({
      data: {
        articleId: article_id,
        userId: req.user!.id,
        content,
        parentCommentId: parent_comment_id,
        status: 'pending', // Requires moderation
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      id: comment.id,
      article_id: comment.articleId,
      user_id: comment.userId,
      user_name: comment.user.name,
      user_avatar: comment.user.avatarUrl,
      content: comment.content,
      status: comment.status,
      likes_count: comment.likesCount,
      replies_count: comment.repliesCount,
      created_at: comment.createdAt.toISOString(),
      updated_at: comment.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
}

export async function getArticleComments(req: any, res: Response) {
  try {
    const { articleId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const comments = await prisma.comment.findMany({
      where: {
        articleId,
        status: 'approved',
        parentCommentId: null, // Top-level only
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        replies: {
          where: { status: 'approved' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.comment.count({
      where: {
        articleId,
        status: 'approved',
      },
    });

    res.json({
      comments: comments.map(c => ({
        id: c.id,
        article_id: c.articleId,
        user_id: c.userId,
        user_name: c.user.name,
        user_avatar: c.user.avatarUrl,
        content: c.content,
        status: c.status,
        likes_count: c.likesCount,
        replies_count: c.replies.length,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
        replies: c.replies.map(r => ({
          id: r.id,
          article_id: r.articleId,
          user_id: r.userId,
          user_name: r.user.name,
          user_avatar: r.user.avatarUrl,
          content: r.content,
          status: r.status,
          likes_count: r.likesCount,
          created_at: r.createdAt.toISOString(),
        })),
      })),
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total,
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
}

export async function getComment(req: any, res: Response) {
  try {
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({
      id: comment.id,
      article_id: comment.articleId,
      user_id: comment.userId,
      user_name: comment.user.name,
      user_avatar: comment.user.avatarUrl,
      content: comment.content,
      status: comment.status,
      likes_count: comment.likesCount,
      created_at: comment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
}

export async function deleteComment(req: AuthRequest, res: Response) {
  try {
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check ownership or moderator
    if (comment.userId !== req.user!.id && !['moderator', 'admin'].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}

export async function likeComment(req: AuthRequest, res: Response) {
  try {
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if already liked
    const existing = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: req.user!.id,
        },
      },
    });

    if (existing) {
      // Unlike
      await prisma.commentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId: req.user!.id,
          },
        },
      });

      await prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: Math.max(0, comment.likesCount - 1) },
      });
    } else {
      // Like
      await prisma.commentLike.create({
        data: {
          commentId,
          userId: req.user!.id,
        },
      });

      await prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: comment.likesCount + 1 },
      });
    }

    const updated = await prisma.comment.findUnique({ where: { id: commentId } });

    res.json({ likes_count: updated?.likesCount });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
}

export async function moderateComment(req: AuthRequest, res: Response) {
  try {
    const { commentId } = req.params;
    const parsed = moderateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { action, reason } = parsed.data;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const newStatus = action === 'flagged' ? 'spam' : action;

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: newStatus,
        moderatedAt: new Date(),
        moderatedBy: req.user!.id,
      },
    });

    // Log moderation action
    await prisma.moderationLog.create({
      data: {
        commentId,
        moderatorId: req.user!.id,
        action,
        reason,
      },
    });

    // Send notification to comment author
    if (newStatus === 'approved') {
      // Notify user their comment was approved
      const io = (global as any).io;
      if (io) {
        io.to(`user:${comment.userId}`).emit('notification', {
          type: 'comment_approved',
          title: 'Your comment was approved',
          message: `"${comment.content.substring(0, 100)}..."`,
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Moderate comment error:', error);
    res.status(500).json({ error: 'Failed to moderate comment' });
  }
}

export async function getPendingComments(req: AuthRequest, res: Response) {
  try {
    const comments = await prisma.comment.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    res.json({
      comments: comments.map(c => ({
        id: c.id,
        article_id: c.articleId,
        user_id: c.userId,
        user_name: c.user.name,
        user_avatar: c.user.avatarUrl,
        content: c.content,
        status: c.status,
        created_at: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get pending comments error:', error);
    res.status(500).json({ error: 'Failed to fetch pending comments' });
  }
}
