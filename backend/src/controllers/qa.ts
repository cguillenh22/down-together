import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const createQASchema = z.object({
  question: z.string().min(10).max(500),
  answer: z.string().min(50).max(5000),
  category: z.string(),
});

const publishQASchema = z.object({
  published: z.boolean(),
});

export async function createQA(req: AuthRequest, res: Response) {
  try {
    const parsed = createQASchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { question, answer, category } = parsed.data;

    // Check if user is verified expert
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { expertVerification: true },
    });

    if (!user || !user.verified || user.role !== 'expert') {
      return res.status(403).json({ error: 'Only verified experts can submit Q&A' });
    }

    const qa = await prisma.expertQA.create({
      data: {
        question,
        answer,
        category,
        expertId: req.user!.id,
        published: false, // Draft by default
      },
    });

    res.status(201).json({
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      expert_id: qa.expertId,
      category: qa.category,
      views_count: qa.viewsCount,
      helpful_count: qa.helpfulCount,
      published: qa.published,
      created_at: qa.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create Q&A error:', error);
    res.status(500).json({ error: 'Failed to create Q&A' });
  }
}

export async function getAllQA(req: any, res: Response) {
  try {
    const { category, limit = 50, offset = 0, sort = 'helpful' } = req.query;

    let orderBy: any = { helpfulCount: 'desc' };
    if (sort === 'recent') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'views') {
      orderBy = { viewsCount: 'desc' };
    }

    const where: any = { published: true };
    if (category) {
      where.category = category;
    }

    const qa = await prisma.expertQA.findMany({
      where,
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            verified: true,
            expertCredentials: true,
          },
        },
      },
      orderBy,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.expertQA.count({ where });

    // Increment view count for each Q&A
    for (const q of qa) {
      await prisma.expertQA.update({
        where: { id: q.id },
        data: { viewsCount: q.viewsCount + 1 },
      });
    }

    res.json({
      qa: qa.map(q => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        expert_id: q.expertId,
        expert_name: q.expert.name,
        expert_credentials: q.expert.expertCredentials,
        expert_verified: q.expert.verified,
        category: q.category,
        views_count: q.viewsCount + 1,
        helpful_count: q.helpfulCount,
        created_at: q.createdAt.toISOString(),
        published: q.published,
      })),
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total,
      },
    });
  } catch (error) {
    console.error('Get Q&A error:', error);
    res.status(500).json({ error: 'Failed to fetch Q&A' });
  }
}

export async function getQA(req: any, res: Response) {
  try {
    const { qaId } = req.params;

    const qa = await prisma.expertQA.findUnique({
      where: { id: qaId },
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            verified: true,
            expertCredentials: true,
          },
        },
      },
    });

    if (!qa || !qa.published) {
      return res.status(404).json({ error: 'Q&A not found' });
    }

    // Increment view count
    await prisma.expertQA.update({
      where: { id: qaId },
      data: { viewsCount: qa.viewsCount + 1 },
    });

    res.json({
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      expert_id: qa.expertId,
      expert_name: qa.expert.name,
      expert_credentials: qa.expert.expertCredentials,
      expert_verified: qa.expert.verified,
      category: qa.category,
      views_count: qa.viewsCount + 1,
      helpful_count: qa.helpfulCount,
      created_at: qa.createdAt.toISOString(),
      published: qa.published,
    });
  } catch (error) {
    console.error('Get Q&A error:', error);
    res.status(500).json({ error: 'Failed to fetch Q&A' });
  }
}

export async function updateQA(req: AuthRequest, res: Response) {
  try {
    const { qaId } = req.params;
    const parsed = createQASchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const qa = await prisma.expertQA.findUnique({ where: { id: qaId } });
    if (!qa) {
      return res.status(404).json({ error: 'Q&A not found' });
    }

    // Check ownership
    if (qa.expertId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Track edit if answer changed
    if (parsed.data.answer && parsed.data.answer !== qa.answer) {
      await prisma.expertQAEdit.create({
        data: {
          qaId,
          oldAnswer: qa.answer,
          newAnswer: parsed.data.answer,
          editedBy: req.user!.id,
        },
      });
    }

    const updated = await prisma.expertQA.update({
      where: { id: qaId },
      data: parsed.data,
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            verified: true,
            expertCredentials: true,
          },
        },
      },
    });

    res.json({
      id: updated.id,
      question: updated.question,
      answer: updated.answer,
      expert_id: updated.expertId,
      expert_name: updated.expert.name,
      category: updated.category,
      views_count: updated.viewsCount,
      helpful_count: updated.helpfulCount,
      published: updated.published,
      created_at: updated.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Update Q&A error:', error);
    res.status(500).json({ error: 'Failed to update Q&A' });
  }
}

export async function publishQA(req: AuthRequest, res: Response) {
  try {
    const { qaId } = req.params;
    const parsed = publishQASchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const qa = await prisma.expertQA.findUnique({ where: { id: qaId } });
    if (!qa) {
      return res.status(404).json({ error: 'Q&A not found' });
    }

    // Check ownership
    if (qa.expertId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.expertQA.update({
      where: { id: qaId },
      data: { published: parsed.data.published },
    });

    // Notify subscribers if published
    if (parsed.data.published) {
      const io = (global as any).io;
      if (io) {
        io.emit('new_qa', {
          id: updated.id,
          question: updated.question,
          category: updated.category,
        });
      }
    }

    res.json({ success: true, published: updated.published });
  } catch (error) {
    console.error('Publish Q&A error:', error);
    res.status(500).json({ error: 'Failed to publish Q&A' });
  }
}

export async function markHelpful(req: AuthRequest, res: Response) {
  try {
    const { qaId } = req.params;

    const qa = await prisma.expertQA.findUnique({ where: { id: qaId } });
    if (!qa) {
      return res.status(404).json({ error: 'Q&A not found' });
    }

    // Check if already marked helpful
    const existing = await prisma.expertQAHelpful.findUnique({
      where: {
        qaId_userId: {
          qaId,
          userId: req.user!.id,
        },
      },
    });

    if (existing) {
      // Remove helpful
      await prisma.expertQAHelpful.delete({
        where: {
          qaId_userId: {
            qaId,
            userId: req.user!.id,
          },
        },
      });

      await prisma.expertQA.update({
        where: { id: qaId },
        data: { helpfulCount: Math.max(0, qa.helpfulCount - 1) },
      });
    } else {
      // Add helpful
      await prisma.expertQAHelpful.create({
        data: {
          qaId,
          userId: req.user!.id,
        },
      });

      await prisma.expertQA.update({
        where: { id: qaId },
        data: { helpfulCount: qa.helpfulCount + 1 },
      });
    }

    const updated = await prisma.expertQA.findUnique({ where: { id: qaId } });

    res.json({
      helpful_count: updated?.helpfulCount,
      is_helpful: !existing,
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ error: 'Failed to mark helpful' });
  }
}

export async function getExpertQA(req: any, res: Response) {
  try {
    const { expertId } = req.params;

    const qa = await prisma.expertQA.findMany({
      where: {
        expertId,
        published: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      qa: qa.map(q => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        category: q.category,
        views_count: q.viewsCount,
        helpful_count: q.helpfulCount,
        created_at: q.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get expert Q&A error:', error);
    res.status(500).json({ error: 'Failed to fetch Q&A' });
  }
}

export async function getMyDrafts(req: AuthRequest, res: Response) {
  try {
    const qa = await prisma.expertQA.findMany({
      where: {
        expertId: req.user!.id,
        published: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      drafts: qa.map(q => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        category: q.category,
        created_at: q.createdAt.toISOString(),
        updated_at: q.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
}
