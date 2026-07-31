import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, requireRole } from '../middleware/auth';
import { emailService } from '../services/email';

const prisma = new PrismaClient();

const requestVerificationSchema = z.object({
  credentials: z.string().min(20),
  specialty: z.string(),
  years_experience: z.number().min(0).max(100),
  bio: z.string().optional(),
});

const approveVerificationSchema = z.object({
  approved: z.boolean(),
  reason: z.string().optional(),
});

export async function requestVerification(req: AuthRequest, res: Response) {
  try {
    const parsed = requestVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { credentials, specialty, years_experience, bio } = parsed.data;

    // Check if already requested
    const existing = await prisma.expertVerification.findUnique({
      where: { userId: req.user!.id },
    });

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ error: 'Verification request already pending' });
      }
      if (existing.status === 'approved') {
        return res.status(409).json({ error: 'Already verified' });
      }
    }

    const request = await prisma.expertVerification.upsert({
      where: { userId: req.user!.id },
      update: {
        credentials,
        specialty,
        yearsExperience: years_experience,
        bio,
        status: 'pending',
      },
      create: {
        userId: req.user!.id,
        credentials,
        specialty,
        yearsExperience: years_experience,
        bio,
      },
    });

    res.status(201).json({
      id: request.id,
      user_id: request.userId,
      status: request.status,
      specialty: request.specialty,
      years_experience: request.yearsExperience,
      created_at: request.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Request verification error:', error);
    res.status(500).json({ error: 'Failed to request verification' });
  }
}

export async function getPendingRequests(req: AuthRequest, res: Response) {
  try {
    const requests = await prisma.expertVerification.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      requests: requests.map(r => ({
        id: r.id,
        user_id: r.userId,
        user_name: r.user.name,
        user_email: r.user.email,
        credentials: r.credentials,
        specialty: r.specialty,
        years_experience: r.yearsExperience,
        bio: r.bio,
        created_at: r.createdAt.toISOString(),
      })),
      total: requests.length,
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
}

export async function approveVerification(req: AuthRequest, res: Response) {
  try {
    const { requestId } = req.params;
    const parsed = approveVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { approved, reason } = parsed.data;

    const verification = await prisma.expertVerification.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!verification) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    const newStatus = approved ? 'approved' : 'rejected';

    const updated = await prisma.expertVerification.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        verifiedBy: req.user!.id,
        verifiedAt: new Date(),
      },
    });

    // If approved, update user role and verified flag
    if (approved) {
      await prisma.user.update({
        where: { id: verification.userId },
        data: {
          role: 'expert',
          verified: true,
          expertBio: verification.bio,
          expertCredentials: verification.credentials.split('\n'),
        },
      });

      // Send email notification
      await emailService.sendExpertVerifiedEmail(
        verification.user.email,
        verification.user.name
      );

      // Send WebSocket notification
      const io = (global as any).io;
      if (io) {
        io.to(`user:${verification.userId}`).emit('notification', {
          type: 'expert_verified',
          title: 'Your expert verification is approved! 🎉',
          message: 'You can now submit expert Q&A and help the community',
        });
      }
    } else {
      // Send rejection email
      await emailService.sendRejectionEmail(
        verification.user.email,
        'expert',
        reason
      );
    }

    res.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  }
}

export async function getVerificationStatus(req: AuthRequest, res: Response) {
  try {
    const verification = await prisma.expertVerification.findUnique({
      where: { userId: req.user!.id },
    });

    if (!verification) {
      return res.json({
        verified: false,
        status: null,
      });
    }

    res.json({
      verified: verification.status === 'approved',
      status: verification.status,
      specialty: verification.specialty,
      years_experience: verification.yearsExperience,
      verified_at: verification.verifiedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
}
