import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const createNotificationSchema = z.object({
  type: z.enum(['comment_reply', 'comment_like', 'newsletter', 'qa_answer', 'expert_verified']),
  title: z.string(),
  message: z.string().optional(),
  link: z.string().optional(),
});

const subscribeNewsletterSchema = z.object({
  email: z.string().email(),
  category: z.enum(['all', 'health', 'education', 'legal', 'weekly_digest']).optional(),
});

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.notification.count({
      where: { userId: req.user!.id },
    });

    const unread = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });

    res.json({
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.read,
        created_at: n.createdAt.toISOString(),
      })),
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total,
      },
      unread_count: unread,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Check ownership
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

export async function markAllRead(req: AuthRequest, res: Response) {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });

    res.json({ updated: result.count });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}

export async function deleteNotification(req: AuthRequest, res: Response) {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Check ownership
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
}

export async function subscribeNewsletter(req: any, res: Response) {
  try {
    const parsed = subscribeNewsletterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { email, category = 'all' } = parsed.data;

    // Generate unsubscribe token
    const token = require('crypto').randomBytes(32).toString('hex');

    const subscription = await prisma.emailSubscription.upsert({
      where: { email },
      update: {
        subscribed: true,
        category,
      },
      create: {
        email,
        category,
        token,
      },
    });

    res.status(201).json({
      success: true,
      subscription_id: subscription.id,
      message: 'Successfully subscribed to newsletter',
    });
  } catch (error) {
    console.error('Subscribe newsletter error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
}

export async function unsubscribeNewsletter(req: any, res: Response) {
  try {
    const { email, token } = req.query;

    if (!email && !token) {
      return res.status(400).json({ error: 'Missing email or token' });
    }

    const where = token ? { token: token as string } : { email: email as string };

    await prisma.emailSubscription.update({
      where,
      data: {
        subscribed: false,
        unsubscribedAt: new Date(),
      },
    });

    res.json({ success: true, message: 'Unsubscribed from newsletter' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
}

export async function getNewsletterStats(req: AuthRequest, res: Response) {
  try {
    const total = await prisma.emailSubscription.count();
    const subscribed = await prisma.emailSubscription.count({
      where: { subscribed: true },
    });

    const byCategory = await prisma.emailSubscription.groupBy({
      by: ['category'],
      where: { subscribed: true },
      _count: true,
    });

    res.json({
      total_subscriptions: total,
      active_subscribers: subscribed,
      by_category: byCategory.map(cat => ({
        category: cat.category,
        count: cat._count,
      })),
    });
  } catch (error) {
    console.error('Get newsletter stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

// Internal function to send broadcast notifications
export async function broadcastNotification(
  type: string,
  title: string,
  message?: string,
  link?: string,
  userIds?: string[]
): Promise<void> {
  try {
    const data = {
      type,
      title,
      message,
      link,
      createdAt: new Date(),
    };

    if (userIds && userIds.length > 0) {
      // Notify specific users
      for (const userId of userIds) {
        await prisma.notification.create({
          data: {
            ...data,
            userId,
          },
        });

        // Send via WebSocket if user is online
        const io = (global as any).io;
        if (io) {
          io.to(`user:${userId}`).emit('notification', {
            id: userId,
            ...data,
          });
        }
      }
    }
  } catch (error) {
    console.error('Broadcast notification error:', error);
  }
}

// Function to send to all subscribers of a category
export async function sendToSubscribers(
  category: string,
  title: string,
  message: string,
  link?: string
): Promise<number> {
  try {
    const subscribers = await prisma.emailSubscription.findMany({
      where: {
        subscribed: true,
        category: { in: [category, 'all'] },
      },
    });

    for (const subscriber of subscribers) {
      // Send email (would integrate with emailService)
      console.log(`Sending to ${subscriber.email}: ${title}`);
    }

    return subscribers.length;
  } catch (error) {
    console.error('Send to subscribers error:', error);
    return 0;
  }
}
