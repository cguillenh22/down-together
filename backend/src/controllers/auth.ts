import { Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, generateTokens, verifyRefreshToken } from '../middleware/auth';
import { env } from '../config/env';
import { emailService } from '../services/email';

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refresh_token: z.string(),
});

export async function register(req: any, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { email, name, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'member',
      },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + env.jwtRefreshExpiresIn * 1000),
      },
    });

    // Send verification email
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    await prisma.emailVerification.create({
      data: {
        email: user.email,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await emailService.sendVerificationEmail(
      user.email,
      `${env.frontendUrl}/verify-email?token=${verificationToken}`
    );

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
      },
      token: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: env.jwtExpiresIn,
        token_type: 'Bearer',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: any, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + env.jwtRefreshExpiresIn * 1000),
      },
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
      },
      token: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: env.jwtExpiresIn,
        token_type: 'Bearer',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function refresh(req: any, res: Response) {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { refresh_token } = parsed.data;

    const decoded = verifyRefreshToken(refresh_token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refresh_token },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email,
      user.role
    );

    // Delete old refresh token
    await prisma.refreshToken.delete({ where: { token: refresh_token } });

    // Create new refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + env.jwtRefreshExpiresIn * 1000),
      },
    });

    res.json({
      success: true,
      token: {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: env.jwtExpiresIn,
        token_type: 'Bearer',
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Refresh failed' });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await prisma.refreshToken.deleteMany({
        where: { userId: req.user?.id },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

export async function verifyEmail(req: any, res: Response) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Missing verification token' });
    }

    const verification = await prisma.emailVerification.findUnique({
      where: { token: token as string },
    });

    if (!verification || verification.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({ where: { email: verification.email } });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    await prisma.emailVerification.delete({ where: { token: token as string } });

    res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}
