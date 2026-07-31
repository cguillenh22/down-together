import { Response } from 'express';
import bcrypt from 'bcrypt';
import { register, login, refresh, logout } from '../controllers/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Controller', () => {
  let mockRequest: any;
  let mockResponse: Response;

  beforeEach(() => {
    mockRequest = {
      body: {},
      headers: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      };

      mockRequest.body = userData;

      // Mock Prisma
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: userData.email,
        name: userData.name,
        role: 'member',
        verified: false,
      });

      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        token: 'refresh-token',
        userId: 'user-1',
      });

      (prisma.emailVerification.create as jest.Mock).mockResolvedValue({
        token: 'verify-token',
      });

      await register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.user.email).toBe(userData.email);
      expect(response.token).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'Password123!',
      };

      mockRequest.body = userData;

      // Mock existing user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: userData.email,
      });

      await register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.error).toBe('Email already registered');
    });

    it('should validate email format', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        name: 'Test',
        password: 'Pass123!',
      };

      await register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        name: 'Test',
        password: 'short',
      };

      await register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockRequest.body = credentials;

      const hashedPassword = await bcrypt.hash(credentials.password, 12);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: credentials.email,
        name: 'Test User',
        passwordHash: hashedPassword,
        role: 'member',
        verified: false,
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      await login(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.user.email).toBe(credentials.email);
      expect(response.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.error).toBe('Invalid credentials');
    });

    it('should reject wrong password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      mockRequest.body = credentials;

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: credentials.email,
        passwordHash: await bcrypt.hash('CorrectPassword', 12),
        name: 'Test User',
        role: 'member',
        verified: false,
      });

      await login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      mockRequest.body = {
        refresh_token: 'valid-refresh-token',
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        token: 'valid-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
      });

      (prisma.refreshToken.delete as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      await refresh(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.token).toBeDefined();
    });

    it('should reject expired refresh token', async () => {
      mockRequest.body = {
        refresh_token: 'expired-token',
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        token: 'expired-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      await refresh(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'member',
      };

      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await logout(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.success).toBe(true);
    });
  });
});
