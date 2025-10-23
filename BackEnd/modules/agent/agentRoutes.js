// agentRoutes.js - Routes for Medical Assistant Chat
import express from 'express';
import {
  startSession,
  sendMessage,
  closeSession,
  singleTurnReply,
  getSessionInfo,
  getConversationHistory,
  MEDICAL_ASSISTANT_PROMPT
} from './agentController.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/agent/session
 * Create a new chat session (authenticated)
 * Returns session ID and optional greeting message
 */
router.post('/session', authMiddleware, async (req, res) => {
  try {
    const { systemPrompt } = req.body;
    
    // Create session with authenticated user context
    const { id } = await startSession(
      systemPrompt || MEDICAL_ASSISTANT_PROMPT,
      req.user
    );
    
    const greeting = "Hello! I'm your Jeewaka Medical Assistant. I can help you with medical questions and guide you through using the platform. What would you like to know?";
    
    console.log('[agentRoutes] Session created:', { 
      sessionId: id, 
      userId: req.user.uid 
    });
    
    res.json({ 
      id, 
      greeting,
      success: true 
    });
  } catch (error) {
    console.error('[agentRoutes] Session creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      message: error.message 
    });
  }
});

/**
 * POST /api/agent/session/:sessionId/message
 * Send a message to an existing session (authenticated)
 * Maintains conversation history and context
 */
router.post('/session/:sessionId/message', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ 
        error: 'Invalid message',
        message: 'Message is required and must be a non-empty string' 
      });
    }
    
    // Verify session exists
    const sessionInfo = getSessionInfo(sessionId);
    if (!sessionInfo) {
      return res.status(404).json({ 
        error: 'Session not found',
        message: 'Session may have expired or is invalid' 
      });
    }
    
    // Verify session belongs to user
    if (sessionInfo.owner && sessionInfo.owner.uid !== req.user.uid) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have access to this session' 
      });
    }
    
    console.log('[agentRoutes] Sending message:', { 
      sessionId, 
      userId: req.user.uid,
      messageLength: message.length 
    });
    
    const reply = await sendMessage(sessionId, message.trim());
    
    res.json({ 
      reply,
      success: true 
    });
  } catch (error) {
    console.error('[agentRoutes] Message send error:', error);
    
    if (error.message === 'session_not_found') {
      return res.status(404).json({ 
        error: 'Session not found',
        message: 'Session may have expired. Please start a new session.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to send message',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/agent/session/:sessionId
 * Close and delete a chat session (authenticated)
 */
router.delete('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify session exists and belongs to user
    const sessionInfo = getSessionInfo(sessionId);
    if (sessionInfo && sessionInfo.owner && sessionInfo.owner.uid !== req.user.uid) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have access to this session' 
      });
    }
    
    const deleted = await closeSession(sessionId);
    
    console.log('[agentRoutes] Session closed:', { 
      sessionId, 
      userId: req.user.uid,
      deleted 
    });
    
    res.json({ 
      success: true,
      deleted,
      message: 'Session closed successfully' 
    });
  } catch (error) {
    console.error('[agentRoutes] Session close error:', error);
    res.status(500).json({ 
      error: 'Failed to close session',
      message: error.message 
    });
  }
});

/**
 * GET /api/agent/session/:sessionId
 * Get session information (authenticated)
 * Returns session metadata and stats
 */
router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionInfo = getSessionInfo(sessionId);
    
    if (!sessionInfo) {
      return res.status(404).json({ 
        error: 'Session not found',
        message: 'Session may have expired or is invalid' 
      });
    }
    
    // Verify session belongs to user
    if (sessionInfo.owner && sessionInfo.owner.uid !== req.user.uid) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have access to this session' 
      });
    }
    
    res.json({ 
      ...sessionInfo,
      success: true 
    });
  } catch (error) {
    console.error('[agentRoutes] Get session info error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve session info',
      message: error.message 
    });
  }
});

/**
 * GET /api/agent/session/:sessionId/history
 * Get conversation history for a session (authenticated)
 */
router.get('/session/:sessionId/history', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify session belongs to user
    const sessionInfo = getSessionInfo(sessionId);
    if (!sessionInfo) {
      return res.status(404).json({ 
        error: 'Session not found',
        message: 'Session may have expired or is invalid' 
      });
    }
    
    if (sessionInfo.owner && sessionInfo.owner.uid !== req.user.uid) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have access to this session' 
      });
    }
    
    const history = getConversationHistory(sessionId);
    
    if (!history) {
      return res.status(404).json({ 
        error: 'History not found',
        message: 'Could not retrieve conversation history' 
      });
    }
    
    res.json({ 
      history,
      success: true 
    });
  } catch (error) {
    console.error('[agentRoutes] Get history error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve history',
      message: error.message 
    });
  }
});

/**
 * POST /api/agent/chat
 * Single-turn chat (no session, optional auth)
 * For quick questions without maintaining conversation context
 */
router.post('/chat', optionalAuthMiddleware, async (req, res) => {
  try {
    const { message, systemPrompt } = req.body;
    
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ 
        error: 'Invalid message',
        message: 'Message is required and must be a non-empty string' 
      });
    }
    
    console.log('[agentRoutes] Single-turn chat:', { 
      userId: req.user?.uid || 'anonymous',
      messageLength: message.length 
    });
    
    const reply = await singleTurnReply(
      message.trim(),
      systemPrompt || MEDICAL_ASSISTANT_PROMPT
    );
    
    res.json({ 
      reply,
      success: true 
    });
  } catch (error) {
    console.error('[agentRoutes] Single-turn chat error:', error);
    res.status(500).json({ 
      error: 'Failed to generate reply',
      message: error.message 
    });
  }
});

/**
 * GET /api/agent/health
 * Health check endpoint (public)
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Medical Assistant Agent',
    timestamp: new Date().toISOString() 
  });
});

export default router;