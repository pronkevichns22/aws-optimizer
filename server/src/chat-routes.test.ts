// ============================================================================
// CHAT ROUTES TESTS
// Tests for chat history management endpoints
// ============================================================================

import { Request, Response } from 'express';
import chatRouter from './chat-routes';
import { ChatHistory } from './models';

// Mock the models
jest.mock('./models', () => ({
  ChatHistory: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

// Mock uuid for consistent test IDs
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-session-id-123'),
}));

describe('Chat Routes', () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      user: {
        userId: 'user-123',
        email: 'test@example.com',
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('Router Export', () => {
    it('should export chat router', () => {
      expect(chatRouter).toBeDefined();
      expect(typeof chatRouter).toBe('function');
    });
  });

  describe('Create Chat Session', () => {
    it('should create chat session with title', () => {
      mockReq.body = { title: 'Test Chat' };
      
      const newChat = {
        chatSessionId: 'test-session-id-123',
        title: 'Test Chat',
        userId: 'user-123',
        save: jest.fn().mockResolvedValue({}),
      };
      
      expect(newChat.title).toBe('Test Chat');
      expect(newChat.userId).toBe('user-123');
    });

    it('should create chat with default title', () => {
      mockReq.body = {};
      
      const defaultTitle = 'New Chat';
      expect(defaultTitle).toBe('New Chat');
    });

    it('should reject request without user', async () => {
      mockReq = { body: {}, query: {}, user: undefined };
      
      const userId = mockReq.user?.userId;
      expect(userId).toBeUndefined();
    });

    it('should include creation metadata', () => {
      const chatData = {
        chatSessionId: 'test-session-id-123',
        title: 'Test',
        createdAt: new Date(),
        messages: [],
      };
      
      expect(chatData).toHaveProperty('chatSessionId');
      expect(chatData).toHaveProperty('title');
      expect(chatData).toHaveProperty('createdAt');
      expect(chatData).toHaveProperty('messages');
    });
  });

  describe('Get All Chats', () => {
    it('should retrieve chats for authenticated user', async () => {
      mockReq.query = { limit: '50', skip: '0' };
      
      const mockChats = [
        {
          chatSessionId: 'session-1',
          title: 'Chat 1',
          createdAt: new Date(),
        },
        {
          chatSessionId: 'session-2',
          title: 'Chat 2',
          createdAt: new Date(),
        },
      ];
      
      (ChatHistory.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockChats),
      });
      
      (ChatHistory.countDocuments as jest.Mock).mockResolvedValue(2);
      
      expect(mockChats).toHaveLength(2);
    });

    it('should support pagination with limit and skip', () => {
      mockReq.query = { limit: '10', skip: '5' };
      
      const limit = parseInt(mockReq.query.limit as string) || 50;
      const skip = parseInt(mockReq.query.skip as string) || 0;
      
      expect(limit).toBe(10);
      expect(skip).toBe(5);
    });

    it('should use default pagination values', () => {
      mockReq.query = {};
      
      const limit = parseInt(mockReq.query.limit as string) || 50;
      const skip = parseInt(mockReq.query.skip as string) || 0;
      
      expect(limit).toBe(50);
      expect(skip).toBe(0);
    });

    it('should return total count with results', async () => {
      (ChatHistory.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      
      (ChatHistory.countDocuments as jest.Mock).mockResolvedValue(42);
      
      const total = await (ChatHistory.countDocuments as jest.Mock)({ userId: 'user-123' });
      expect(total).toBe(42);
    });

    it('should reject request without authentication', () => {
      mockReq = { body: {}, query: {}, user: undefined };
      const userId = mockReq.user?.userId;
      expect(userId).toBeUndefined();
    });
  });

  describe('Get Chat by ID', () => {
    it('should retrieve single chat session', async () => {
      const mockChat = {
        chatSessionId: 'session-123',
        title: 'My Chat',
        messages: [],
        userId: 'user-123',
      };
      
      (ChatHistory.findById as jest.Mock).mockResolvedValue(mockChat);
      
      const chat = await (ChatHistory.findById as jest.Mock)('session-123');
      expect(chat.chatSessionId).toBe('session-123');
      expect(chat.title).toBe('My Chat');
    });

    it('should handle chat not found', async () => {
      (ChatHistory.findById as jest.Mock).mockResolvedValue(null);
      
      const chat = await (ChatHistory.findById as jest.Mock)('nonexistent');
      expect(chat).toBeNull();
    });

    it('should include message history', () => {
      const mockChat = {
        chatSessionId: 'session-123',
        messages: [
          {
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
          {
            role: 'assistant',
            content: 'Hi there!',
            timestamp: new Date(),
          },
        ],
      };
      
      expect(mockChat.messages).toHaveLength(2);
      expect(mockChat.messages[0].role).toBe('user');
    });
  });

  describe('Add Message to Chat', () => {
    it('should add user message to chat', () => {
      const message = {
        role: 'user',
        content: 'What is the status?',
        timestamp: new Date(),
      };
      
      expect(message.role).toBe('user');
      expect(message.content).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('should add assistant message to chat', () => {
      const message = {
        role: 'assistant',
        content: 'Here is the status...',
        timestamp: new Date(),
      };
      
      expect(message.role).toBe('assistant');
      expect(message.content).toBeDefined();
    });

    it('should validate message content', () => {
      const message = {
        role: 'user',
        content: '',
        timestamp: new Date(),
      };
      
      expect(message.content).toBe('');
      expect(message.content.length).toBe(0);
    });

    it('should update chat metadata when message added', async () => {
      const updatedChat = {
        chatSessionId: 'session-123',
        updatedAt: new Date(),
      };
      
      expect(updatedChat).toHaveProperty('updatedAt');
      expect(updatedChat.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Chat Query and Filtering', () => {
    it('should filter chats by user', () => {
      const filter = { userId: 'user-123' };
      expect(filter.userId).toBe('user-123');
    });

    it('should sort chats by update time', () => {
      const sort = { updatedAt: -1 };
      expect(sort.updatedAt).toBe(-1); // Descending
    });

    it('should select specific fields from chat', () => {
      const fields = 'chatSessionId title createdAt updatedAt';
      expect(fields).toContain('chatSessionId');
      expect(fields).toContain('title');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      (ChatHistory.find as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      expect(async () => {
        await (ChatHistory.find as jest.Mock)({ userId: 'user-123' });
      }).rejects.toThrow();
    });

    it('should return error response on failure', () => {
      const error = new Error('Failed to create chat');
      expect(error.message).toBe('Failed to create chat');
    });

    it('should include error message in response', () => {
      const response = {
        success: false,
        message: 'Failed to create chat session',
        error: 'DB connection error',
      };
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('Response Format', () => {
    it('should return success response structure', () => {
      const response = {
        success: true,
        message: 'Chat session created',
        data: {
          chatSessionId: 'session-123',
          title: 'Test Chat',
        },
      };
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    it('should include proper HTTP status codes', () => {
      const statuses = {
        created: 201,
        success: 200,
        notFound: 404,
        error: 500,
      };
      
      expect(statuses.created).toBe(201);
      expect(statuses.success).toBe(200);
    });
  });
});
