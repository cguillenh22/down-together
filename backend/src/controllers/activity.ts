import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, requireRole } from '../middleware/auth';

const prisma = new PrismaClient();

const trackActivitySchema = z.object({
  activity_type: z.enum(['article_read', 'comment_posted', 'bookmark_saved', 'qa_viewed', 'shared']),
  article_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function trackActivity(req: AuthRequest, res: Response) {
  try {
    const parsed = trackActivitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { activity_type, article_id, metadata } = parsed.data;

    const activity = await prisma.userActivity.create({
      data: {
        userId: req.user!.id,
        activityType: activity_type,
        articleId: article_id,
        metadata,
      },
    });

    res.json({
      id: activity.id,
      activity_type: activity.activityType,
      article_id: activity.articleId,
      created_at: activity.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Track activity error:', error);
    res.status(500).json({ error: 'Failed to track activity' });
  }
}

export async function getUserActivity(req: AuthRequest, res: Response) {
  try {
    const { limit = 100, offset = 0, activity_type } = req.query;

    const where: any = { userId: req.user!.id };
    if (activity_type) {
      where.activityType = activity_type;
    }

    const activities = await prisma.userActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.userActivity.count({ where });

    res.json({
      activities: activities.map(a => ({
        id: a.id,
        activity_type: a.activityType,
        article_id: a.articleId,
        metadata: a.metadata,
        created_at: a.createdAt.toISOString(),
      })),
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total,
      },
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
}

export async function getAnalytics(req: AuthRequest, res: Response) {
  try {
    // Get analytics for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.user.count();

    // Active users (last 30 days)
    const activeUsers = await prisma.userActivity.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Total comments
    const totalComments = await prisma.comment.count();

    // Approved comments
    const approvedComments = await prisma.comment.count({
      where: { status: 'approved' },
    });

    // Total Q&A
    const totalQA = await prisma.expertQA.count();

    // Published Q&A
    const publishedQA = await prisma.expertQA.count({
      where: { published: true },
    });

    // Verified experts
    const verifiedExperts = await prisma.user.count({
      where: { role: 'expert', verified: true },
    });

    // Activity breakdown (last 30 days)
    const activityBreakdown = await prisma.userActivity.groupBy({
      by: ['activityType'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    });

    // Top articles (by reads)
    const topArticles = await prisma.userActivity.groupBy({
      by: ['articleId'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        activityType: 'article_read',
      },
      _count: true,
      orderBy: { _count: { articleId: 'desc' } },
      take: 10,
    });

    // Most commented articles
    const mostCommented = await prisma.comment.groupBy({
      by: ['articleId'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      orderBy: { _count: { articleId: 'desc' } },
      take: 10,
    });

    res.json({
      overview: {
        total_users: totalUsers,
        active_users_30d: activeUsers.length,
        verified_experts: verifiedExperts,
        total_comments: totalComments,
        approved_comments: approvedComments,
        total_qa: totalQA,
        published_qa: publishedQA,
      },
      activity_30d: {
        breakdown: activityBreakdown.map(a => ({
          activity_type: a.activityType,
          count: a._count,
        })),
      },
      top_content: {
        articles_by_reads: topArticles.map(a => ({
          article_id: a.articleId,
          reads: a._count,
        })),
        articles_by_comments: mostCommented.map(a => ({
          article_id: a.articleId,
          comments: a._count,
        })),
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

export async function getEngagementMetrics(req: AuthRequest, res: Response) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // User engagement
    const userEngagement = await prisma.userActivity.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    });

    const avgActivitiesPerUser =
      userEngagement.length > 0
        ? userEngagement.reduce((sum, u) => sum + u._count, 0) / userEngagement.length
        : 0;

    // Comment engagement
    const totalCommentLikes = await prisma.commentLike.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Q&A engagement
    const totalQAHelpful = await prisma.expertQAHelpful.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Bookmark retention
    const bookmarks = await prisma.bookmark.count();

    res.json({
      engagement: {
        avg_activities_per_user_30d: Math.round(avgActivitiesPerUser * 100) / 100,
        comment_likes_30d: totalCommentLikes,
        qa_helpful_votes_30d: totalQAHelpful,
        total_bookmarks: bookmarks,
        user_retention: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          values: [100, 85, 72, 65], // Example retention curve
        },
      },
    });
  } catch (error) {
    console.error('Get engagement metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}
