// ============================================================================
// FILE: chat-routes.ts
// LOCATION: server/src/
// PURPOSE: Chat history management endpoints
// ============================================================================

import { Router, Request, Response } from 'express';
import { ChatHistory } from './models';
import { authMiddleware } from './auth-middleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ============================================================================
// CREATE NEW CHAT SESSION
// ============================================================================
router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const chatSession = new ChatHistory({
      userId,
      chatSessionId: uuidv4(),
      title: title || 'New Chat',
      messages: [],
    });

    await chatSession.save();

    res.status(201).json({
      success: true,
      message: 'Chat session created',
      data: {
        chatSessionId: chatSession.chatSessionId,
        title: chatSession.title,
        createdAt: chatSession.createdAt,
      },
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET ALL CHATS FOR USER
// ============================================================================
router.get('/chats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const chats = await ChatHistory.find({ userId })
      .select('chatSessionId title createdAt updatedAt context')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await ChatHistory.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        chats,
        total,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chats',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET SPECIFIC CHAT BY ID
// ============================================================================
router.get('/chat/:chatSessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { chatSessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const chat = await ChatHistory.findOne({ chatSessionId, userId });

    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
      return;
    }

    // Update last accessed time
    chat.lastAccessedAt = new Date();
    await chat.save();

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// ADD MESSAGE TO CHAT
// ============================================================================
router.post('/chat/:chatSessionId/message', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { chatSessionId } = req.params;
    const { role, content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!role || !content) {
      res.status(400).json({
        success: false,
        message: 'Role and content are required',
      });
      return;
    }

    if (!['user', 'assistant'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Role must be either "user" or "assistant"',
      });
      return;
    }

    const chat = await ChatHistory.findOne({ chatSessionId, userId });

    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
      return;
    }

    // Add message
    chat.messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      success: true,
      message: 'Message added',
      data: {
        chatSessionId,
        messageCount: chat.messages.length,
      },
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// UPDATE CHAT CONTEXT (resource count, cost, alerts)
// ============================================================================
router.put('/chat/:chatSessionId/context', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { chatSessionId } = req.params;
    const { resourceCount, totalCost, alertCount } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const chat = await ChatHistory.findOne({ chatSessionId, userId });

    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
      return;
    }

    // Update context
    if (chat.context) {
      if (resourceCount !== undefined) chat.context.resourceCount = resourceCount;
      if (totalCost !== undefined) chat.context.totalCost = totalCost;
      if (alertCount !== undefined) chat.context.alertCount = alertCount;
    }

    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      success: true,
      message: 'Chat context updated',
    });
  } catch (error) {
    console.error('Update context error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat context',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// UPDATE CHAT TITLE
// ============================================================================
router.put('/chat/:chatSessionId/title', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { chatSessionId } = req.params;
    const { title } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!title) {
      res.status(400).json({
        success: false,
        message: 'Title is required',
      });
      return;
    }

    const chat = await ChatHistory.findOne({ chatSessionId, userId });

    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
      return;
    }

    chat.title = title;
    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      success: true,
      message: 'Chat title updated',
    });
  } catch (error) {
    console.error('Update title error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat title',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// DELETE CHAT
// ============================================================================
router.delete('/chat/:chatSessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { chatSessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const result = await ChatHistory.deleteOne({ chatSessionId, userId });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Chat deleted',
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// CLEAR CHAT MESSAGES (but keep the session)
// ============================================================================
router.post('/chat/:chatSessionId/clear', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { chatSessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const chat = await ChatHistory.findOne({ chatSessionId, userId });

    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
      return;
    }

    chat.messages.splice(0, chat.messages.length);
    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      success: true,
      message: 'Chat messages cleared',
    });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
