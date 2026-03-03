import express from 'express';
import orchestratorAgent from '../agents/orchestrator.js';
import { runAgent, resolveOpenAIConfig } from '../utils/openaiRun.js';
import {
  createChatSession,
  addChatMessage,
  listChatSessionsByUserId,
  getChatMessagesBySessionId,
  getChatMessagesForAgentContext,
  renameChatSession,
  deleteChatSessionById,
  clearChatSessionMessages,
} from '../db/db.js';
import { runWithContext } from '../auth/requestContext.js';
import { resolveGoogleContext } from '../auth/googleContext.js';
import { getHistory, addToHistory, clearConversation, formatHistory } from '../chat/conversationMemory.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { logger } from '../utils/logger.js';

const requireUser = (req, res) => {
  if (req.user?.id) return true;
  res.status(401).json({ error: 'Authentication required' });
  return false;
};

export const chatRouter = ({ developerMode }) => {
  const router = express.Router();

  // Chat history (DB-backed)
  router.get('/chat/sessions', async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      logger.info('chat.sessions.list', { userId: req.user.id });
      const sessions = await listChatSessionsByUserId({ userId: req.user.id, limit: 50, offset: 0 });
      return res.json({ sessions });
    } catch (err) {
      logger.error('chat.sessions.list.error', { userId: req.user.id, error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  router.post('/chat/sessions', async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      const { title } = req.body || {};
      logger.info('chat.sessions.create', { userId: req.user.id, hasTitle: !!title });
      const session = await createChatSession({
        userId: req.user.id,
        title: typeof title === 'string' ? title : undefined,
      });
      return res.json({ session });
    } catch (err) {
      logger.error('chat.sessions.create.error', { userId: req.user.id, error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  router.get('/chat/sessions/:chatSessionId/messages', async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      const { chatSessionId } = req.params;
      logger.info('chat.sessions.messages.list', { userId: req.user.id, chatSessionId });
      const messages = await getChatMessagesBySessionId({
        chatSessionId,
        userId: req.user.id,
        limit: 1000,
        offset: 0,
      });
      return res.json({ messages });
    } catch (err) {
      logger.error('chat.sessions.messages.list.error', {
        userId: req.user.id,
        chatSessionId: req.params.chatSessionId,
        error: err.message,
      });
      return res.status(500).json({ error: err.message });
    }
  });

  router.patch('/chat/sessions/:chatSessionId', async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      const { chatSessionId } = req.params;
      const { title } = req.body || {};
      logger.info('chat.sessions.rename', {
        userId: req.user.id,
        chatSessionId,
        hasTitle: typeof title === 'string' && title.length > 0,
      });
      await renameChatSession({
        chatSessionId,
        userId: req.user.id,
        title: typeof title === 'string' ? title : null,
      });
      return res.json({ success: true });
    } catch (err) {
      logger.error('chat.sessions.rename.error', {
        userId: req.user.id,
        chatSessionId: req.params.chatSessionId,
        error: err.message,
      });
      return res.status(500).json({ error: err.message });
    }
  });

  router.delete('/chat/sessions/:chatSessionId', async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      const { chatSessionId } = req.params;
      logger.info('chat.sessions.delete', { userId: req.user.id, chatSessionId });
      await deleteChatSessionById({ chatSessionId, userId: req.user.id });
      return res.json({ success: true });
    } catch (err) {
      logger.error('chat.sessions.delete.error', {
        userId: req.user.id,
        chatSessionId: req.params.chatSessionId,
        error: err.message,
      });
      return res.status(500).json({ error: err.message });
    }
  });

  // Core chat endpoint
  router.post('/chat', rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
    const { message, sessionId = 'default' } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const openaiConfig = await resolveOpenAIConfig(req.user?.id ?? null, developerMode);
    if (!openaiConfig.apiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured. Set it in Settings or in server .env.',
      });
    }

    const start = Date.now();

    try {
      logger.info('chat.message.incoming', {
        sessionId,
        userId: req.user?.id || null,
        preview: message.substring(0, 80),
      });

      const trimmed = message.trim();

      let history = null;
      let effectiveSessionId = sessionId;
      if (req.user?.id) {
        logger.debug('chat.history.db', { userId: req.user.id, sessionId });
        const userMsg = await addChatMessage({
          chatSessionId: sessionId,
          userId: req.user.id,
          role: 'user',
          content: trimmed,
        });
        effectiveSessionId = userMsg.sessionId || sessionId;
        history = await getChatMessagesForAgentContext({
          chatSessionId: effectiveSessionId,
          userId: req.user.id,
          limit: 20,
        });
      } else {
        logger.debug('chat.history.memory', { sessionId });
        addToHistory(sessionId, 'user', trimmed);
        history = getHistory(sessionId);
      }

      const agentInput = formatHistory(history);

      const googleCtx = await resolveGoogleContext({
        userId: req.user?.id || null,
        userEmail: req.user?.email,
      });
      const result = await runWithContext(
        { userId: req.user?.id || null, developerMode, ...googleCtx },
        async () => await runAgent(orchestratorAgent, agentInput, { userId: req.user?.id ?? null, developerMode })
      );

      const latencyMs = Date.now() - start;
      logger.info('chat.message.completed', {
        sessionId: effectiveSessionId,
        userId: req.user?.id || null,
        latencyMs,
      });

      const assistantReply = result.finalOutput || 'I could not generate a response. Please try again.';
      const lastAgentName = result.lastAgent?.name || 'Orchestrator';

      if (req.user?.id) {
        logger.debug('chat.message.persist', {
          userId: req.user.id,
          sessionId: effectiveSessionId,
          role: 'assistant',
          agentName: lastAgentName,
        });
        await addChatMessage({
          chatSessionId: effectiveSessionId,
          userId: req.user.id,
          role: 'assistant',
          content: assistantReply,
          agentName: lastAgentName,
        });
      } else {
        addToHistory(sessionId, 'assistant', assistantReply);
      }

      return res.json({
        reply: assistantReply,
        agentName: lastAgentName,
        sessionId: effectiveSessionId,
        latencyMs,
      });
    } catch (err) {
      logger.error('chat.message.error', {
        sessionId,
        userId: req.user?.id || null,
        error: err.message,
      });
      return res.status(500).json({
        error: `An error occurred: ${err.message}`,
      });
    }
  });

  // Clear in-memory + DB-backed session history
  router.delete('/chat/:sessionId', async (req, res) => {
    const sid = req.params.sessionId;
    clearConversation(sid);
    if (req.user?.id) {
      try {
        await clearChatSessionMessages({ chatSessionId: sid, userId: req.user.id });
      } catch (err) {
        logger.error('chat.session.clear.error', {
          userId: req.user.id,
          chatSessionId: sid,
          error: err.message,
        });
        return res.status(500).json({ error: err.message });
      }
    }
    res.json({ success: true, message: 'Session history cleared' });
  });

  return router;
};

