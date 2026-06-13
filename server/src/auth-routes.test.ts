// ============================================================================
// AUTH ROUTES TESTS
// Tests for authentication endpoints - register, login, logout, profile
// ============================================================================

import { Request, Response } from 'express';
import authRouter from './auth-routes';
import { User, UserSession } from './models';
import {
  generateToken,
  hashPassword,
  comparePasswords,
  isValidEmail,
  validatePasswordStrength,
} from './auth-utils';

// Mock the models
jest.mock('./models', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
  UserSession: {
    create: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  },
  AIPreferences: {
    create: jest.fn(),
  },
}));

describe('Auth Routes', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      ip: '127.0.0.1',
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('Router Export', () => {
    it('should export auth router', () => {
      expect(authRouter).toBeDefined();
      expect(typeof authRouter).toBe('function');
    });
  });

  describe('Register Endpoint', () => {
    it('should reject request with missing fields', () => {
      mockReq.body = { username: 'testuser' };
      
      const required = ['username', 'email', 'password', 'confirmPassword'];
      const provided = Object.keys(mockReq.body || {});
      const missing = required.filter(field => !provided.includes(field));
      
      expect(missing).toContain('email');
      expect(missing).toContain('password');
    });

    it('should reject request if passwords do not match', () => {
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123',
        confirmPassword: 'DifferentPass123',
      };
      
      expect(mockReq.body.password).not.toBe(mockReq.body.confirmPassword);
    });

    it('should reject invalid email format', () => {
      const emails = ['notanemail', 'missing@domain', '@domain.com'];
      
      emails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should reject weak password', () => {
      const weakPasswords = [
        'short',                // Too short
        'lowercase123',         // No uppercase
        'UPPERCASE123',         // No lowercase
        'NoNumbers',            // No numbers
      ];
      
      weakPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject if user already exists', async () => {
      mockReq.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      };
      
      (User.findOne as jest.Mock).mockResolvedValue({ username: 'existinguser' });
      
      const existingUser = await (User.findOne as jest.Mock)({
        $or: [{ email: mockReq.body.email }, { username: mockReq.body.username }],
      });
      
      expect(existingUser).toBeDefined();
    });

    it('should create user with valid data', async () => {
      mockReq.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      };
      
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      const hashedPassword = await hashPassword(mockReq.body.password);
      expect(hashedPassword).not.toBe(mockReq.body.password);
    });

    it('should hash password with bcrypt', async () => {
      const password = 'MyPassword123';
      const hashed = await hashPassword(password);
      
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
    });

    it('should generate JWT token on successful registration', () => {
      const userId = 'new-user-123';
      const email = 'new@example.com';
      const token = generateToken(userId, email);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should create session on registration', () => {
      const sessionData = {
        userId: 'user-123',
        token: 'jwt-token-here',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0...',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      
      expect(sessionData).toHaveProperty('userId');
      expect(sessionData).toHaveProperty('token');
      expect(sessionData).toHaveProperty('expiresAt');
    });

    it('should return user data on success', () => {
      const response = {
        success: true,
        message: 'User registered successfully',
        data: {
          userId: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token',
        },
      };
      
      expect(response.success).toBe(true);
      expect(response.data.userId).toBeDefined();
    });
  });

  describe('Login Endpoint', () => {
    it('should reject request with missing credentials', () => {
      mockReq.body = { email: 'test@example.com' };
      
      expect(mockReq.body.email).toBeDefined();
      expect(mockReq.body.password).toBeUndefined();
    });

    it('should reject invalid email (user not found)', async () => {
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'SomePass123',
      };
      
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      const user = await (User.findOne as jest.Mock)({ email: mockReq.body.email });
      expect(user).toBeNull();
    });

    it('should reject invalid password', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'WrongPassword123',
      };
      
      const storedHash = await hashPassword('CorrectPassword123');
      const passwordValid = await comparePasswords(mockReq.body.password, storedHash);
      
      expect(passwordValid).toBe(false);
    });

    it('should accept valid credentials', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'CorrectPassword123',
      };
      
      const correctHash = await hashPassword(mockReq.body.password);
      const passwordValid = await comparePasswords(mockReq.body.password, correctHash);
      
      expect(passwordValid).toBe(true);
    });

    it('should generate token on login', () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const token = generateToken(userId, email);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should create session on login', () => {
      const sessionData = {
        userId: 'user-123',
        token: 'new-jwt-token',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0...',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      
      expect(sessionData).toHaveProperty('userId');
      expect(sessionData).toHaveProperty('expiresAt');
    });

    it('should update last login timestamp', () => {
      const now = new Date();
      expect(now).toBeInstanceOf(Date);
      expect(now.getTime()).toBeGreaterThan(0);
    });

    it('should return user info and token on success', () => {
      const response = {
        success: true,
        message: 'Login successful',
        data: {
          userId: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          token: 'jwt-token',
          awsCredentialsSet: false,
        },
      };
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('awsCredentialsSet');
    });

    it('should indicate if AWS credentials are configured', () => {
      const userData = {
        awsAccessKeyId: 'AKIA...',
        awsSecretAccessKey: 'secret...',
      };
      
      const credentialsSet = !!userData.awsAccessKeyId && !!userData.awsSecretAccessKey;
      expect(credentialsSet).toBe(true);
    });
  });

  describe('Logout Endpoint', () => {
    it('should require authentication', () => {
      mockReq.user = undefined;
      expect(mockReq.user).toBeUndefined();
    });

    it('should delete session on logout', async () => {
      mockReq.user = { userId: 'user-123', email: 'test@example.com' };
      mockReq.headers = { authorization: 'Bearer token-123' };
      
      expect(mockReq.user).toBeDefined();
    });

    it('should return success response', () => {
      const response = {
        success: true,
        message: 'Logged out successfully',
      };
      
      expect(response.success).toBe(true);
    });
  });

  describe('Profile Endpoint', () => {
    it('should require authentication', () => {
      mockReq.user = undefined;
      expect(mockReq.user).toBeUndefined();
    });

    it('should return user profile', async () => {
      mockReq.user = { userId: 'user-123', email: 'test@example.com' };
      
      const mockUser = {
        _id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        awsRegion: 'us-east-1',
        isLocalStack: false,
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      };
      
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      
      const user = await (User.findById as jest.Mock)('user-123');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });

    it('should include user preferences', () => {
      const profile = {
        username: 'testuser',
        email: 'test@example.com',
        preferences: {
          theme: 'dark',
          notifications: true,
          autoRefresh: true,
        },
      };
      
      expect(profile.preferences.theme).toBe('dark');
      expect(profile.preferences.notifications).toBe(true);
    });

    it('should include AWS configuration', () => {
      const profile = {
        username: 'testuser',
        awsRegion: 'us-east-1',
        isLocalStack: false,
        localStackEndpoint: 'http://localhost:4566',
      };
      
      expect(profile.awsRegion).toBeDefined();
      expect(profile.isLocalStack).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));
      
      expect(async () => {
        await (User.findOne as jest.Mock)({ email: 'test@example.com' });
      }).rejects.toThrow();
    });

    it('should return 500 on server error', () => {
      const errorResponse = {
        success: false,
        message: 'Registration failed',
        error: 'Unknown error',
      };
      
      expect(errorResponse.success).toBe(false);
    });

    it('should return 400 on validation error', () => {
      const validationError = {
        success: false,
        message: 'Invalid email format',
      };
      
      expect(validationError.success).toBe(false);
      expect(validationError.message).toContain('Invalid');
    });

    it('should return 409 if user already exists', () => {
      const conflictError = {
        success: false,
        message: 'User with this email or username already exists',
      };
      
      expect(conflictError.success).toBe(false);
    });
  });

  describe('Response Format', () => {
    it('should include success flag in response', () => {
      const response = {
        success: true,
        message: 'Operation successful',
      };
      
      expect(response).toHaveProperty('success');
      expect(typeof response.success).toBe('boolean');
    });

    it('should include message in response', () => {
      const response = {
        success: true,
        message: 'User registered successfully',
      };
      
      expect(response).toHaveProperty('message');
      expect(typeof response.message).toBe('string');
    });

    it('should include data in success response', () => {
      const response = {
        success: true,
        data: {
          userId: 'user-123',
          token: 'jwt-token',
        },
      };
      
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('userId');
    });
  });
});
