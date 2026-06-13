// ============================================================================
// AUTH MIDDLEWARE TESTS
// Tests for JWT authentication and authorization middleware
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware } from './auth-middleware';
import { User } from './models';
import { generateToken } from './auth-utils';

// Mock the User model
jest.mock('./models', () => ({
  User: {
    findById: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
      ip: '127.0.0.1',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Auth Middleware - Token Validation', () => {
    it('should reject request without authorization header', async () => {
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No authorization token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid Bearer format', async () => {
      mockReq.headers = { authorization: 'InvalidFormat token' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid.token' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
    });

    it('should reject request if user not found in database', async () => {
      const token = generateToken('nonexistent-user', 'test@example.com');
      mockReq.headers = { authorization: `Bearer ${token}` };
      (User.findById as jest.Mock).mockResolvedValue(null);

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should attach user to request with valid token', async () => {
      const userId = 'user-123';
      const email = 'user@example.com';
      const token = generateToken(userId, email);
      mockReq.headers = { authorization: `Bearer ${token}` };
      (User.findById as jest.Mock).mockResolvedValue({ _id: userId, email });

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe(userId);
      expect(mockReq.user?.email).toBe(email);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const token = generateToken('user-123', 'test@example.com');
      mockReq.headers = { authorization: `Bearer ${token}` };
      (User.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication error',
      });
    });
  });

  describe('Optional Auth Middleware', () => {
    it('should call next without error if no authorization header', async () => {
      mockReq.headers = {};

      await optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should attach user if valid token provided', async () => {
      const userId = 'user-456';
      const email = 'user2@example.com';
      const token = generateToken(userId, email);
      mockReq.headers = { authorization: `Bearer ${token}` };
      (User.findById as jest.Mock).mockResolvedValue({ _id: userId, email });

      await optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user?.userId).toBe(userId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user if token is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      await optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should continue if user not found in database', async () => {
      const token = generateToken('nonexistent', 'test@example.com');
      mockReq.headers = { authorization: `Bearer ${token}` };
      (User.findById as jest.Mock).mockResolvedValue(null);

      await optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should continue even if database error occurs', async () => {
      const token = generateToken('user-123', 'test@example.com');
      mockReq.headers = { authorization: `Bearer ${token}` };
      (User.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      await optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Authorization Header Parsing', () => {
    it('should extract token from Bearer header', async () => {
      const token = generateToken('user-123', 'test@example.com');
      mockReq.headers = { authorization: `Bearer ${token}` };
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user-123' });

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject if Bearer not followed by space and token', async () => {
      mockReq.headers = { authorization: 'Bearer' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject if authorization header has wrong scheme', async () => {
      const token = generateToken('user-123', 'test@example.com');
      mockReq.headers = { authorization: `Basic ${token}` };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
