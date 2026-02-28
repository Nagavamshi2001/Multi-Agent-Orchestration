import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { run } from '@openai/agents';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import orchestratorAgent from './agents/orchestrator.js';
import {
  isEmailConfigured,
  isCalendarConfigured,
  isTasksConfigured,
} from './utils/googleAuth.js';
import {
  initDb,
  cleanupExpiredSessions,
  createChatSession,
  ensureChatSession,
  addChatMessage,
  listChatSessionsByUserId,
  getChatMessagesBySessionId,
  getChatMessagesForAgentContext,
  renameChatSession,
  deleteChatSessionById,
  clearChatSessionMessages,
} from './db/db.js';
import { attachUser } from './auth/session.js';
import { googleAuthRouter } from './auth/googleRoutes.js';
import { runWithContext } from './auth/requestContext.js';
import { resolveGoogleContext } from './auth/googleContext.js';
import { getHistory, addToHistory, clearConversation, formatHistory } from './chat/conversationMemory.js';
import { attachChatWebSocketServer } from './ws/chatWsServer.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const developerMode = ['1', 'true', 'yes', 'on'].includes(String(process.env.DEVELOPER_MODE || '').toLowerCase());

// Initialize local DB (sql.js)
await initDb();
// best-effort cleanup (non-blocking)
cleanupExpiredSessions().catch(() => {});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (origin === FRONTEND_URL) return cb(null, true);
      return cb(new Error('CORS blocked'), false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', googleAuthRouter());

const requireUser = (req, res) => {
  if (req.user?.id) return true;
  res.status(401).json({ error: 'Authentication required' });
  return false;
};

// ─── REST: Chat History APIs (DB-backed) ──────────────────────────────────────
app.get('/api/chat/sessions', async (req, res) => {
  if (!requireUser(req, res)) return;
  try {
    const sessions = await listChatSessionsByUserId({ userId: req.user.id, limit: 50, offset: 0 });
    return res.json({ sessions });
  } catch (err) {
    console.error('[ChatHistory] list sessions error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat/sessions', async (req, res) => {
  if (!requireUser(req, res)) return;
  try {
    const { title } = req.body || {};
    const session = await createChatSession({ userId: req.user.id, title: typeof title === 'string' ? title : undefined });
    return res.json({ session });
  } catch (err) {
    console.error('[ChatHistory] create session error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/chat/sessions/:chatSessionId/messages', async (req, res) => {
  if (!requireUser(req, res)) return;
  try {
    const { chatSessionId } = req.params;
    const messages = await getChatMessagesBySessionId({ chatSessionId, userId: req.user.id, limit: 1000, offset: 0 });
    return res.json({ messages });
  } catch (err) {
    console.error('[ChatHistory] get messages error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.patch('/api/chat/sessions/:chatSessionId', async (req, res) => {
  if (!requireUser(req, res)) return;
  try {
    const { chatSessionId } = req.params;
    const { title } = req.body || {};
    await renameChatSession({ chatSessionId, userId: req.user.id, title: typeof title === 'string' ? title : null });
    return res.json({ success: true });
  } catch (err) {
    console.error('[ChatHistory] rename session error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/chat/sessions/:chatSessionId', async (req, res) => {
  if (!requireUser(req, res)) return;
  try {
    const { chatSessionId } = req.params;
    await deleteChatSessionById({ chatSessionId, userId: req.user.id });
    return res.json({ success: true });
  } catch (err) {
    console.error('[ChatHistory] delete session error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── REST: Health Check ───────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        agents: ['orchestrator', 'emailAssistant', 'calendarAssistant', 'tasksAssistant', 'newsAssistant', 'searchAssistant'],
        emailConfigured: isEmailConfigured(),
        calendarConfigured: isCalendarConfigured(),
        tasksConfigured: isTasksConfigured(),
        openaiConfigured: !!process.env.OPENAI_API_KEY,
    });
});

// ─── REST: Chat Endpoint ──────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const { message, sessionId = 'default' } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
        return res.status(500).json({
            error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.',
        });
    }

    try {
        console.log(`[Chat] sessionId=${sessionId} | message="${message.substring(0, 80)}..."`);

        const trimmed = message.trim();

        let history = null;
        if (req.user?.id) {
          await ensureChatSession({ chatSessionId: sessionId, userId: req.user.id });
          await addChatMessage({ chatSessionId: sessionId, userId: req.user.id, role: 'user', content: trimmed });
          history = await getChatMessagesForAgentContext({ chatSessionId: sessionId, userId: req.user.id, limit: 20 });
        } else {
          addToHistory(sessionId, 'user', trimmed);
          history = getHistory(sessionId);
        }

        // Format history into SDK-compatible content-part arrays
        const agentInput = formatHistory(history);

        const googleCtx = await resolveGoogleContext({ userId: req.user?.id || null, userEmail: req.user?.email });
        // Run under request context so Google tools can pick correct user tokens
        const result = await runWithContext(
          { userId: req.user?.id || null, developerMode, ...googleCtx },
          async () => await run(orchestratorAgent, agentInput)
        );

        const assistantReply = result.finalOutput || 'I could not generate a response. Please try again.';

        // Track which agent ultimately answered
        const lastAgentName = result.lastAgent?.name || 'Orchestrator';

        if (req.user?.id) {
          await addChatMessage({
            chatSessionId: sessionId,
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
            sessionId,
        });
    } catch (err) {
        console.error('[Chat] Error:', err);
        return res.status(500).json({
            error: `An error occurred: ${err.message}`,
        });
    }
});

// ─── REST: Clear Session History ──────────────────────────────────────────────
app.delete('/api/chat/:sessionId', async (req, res) => {
    const sid = req.params.sessionId;
    clearConversation(sid);
    if (req.user?.id) {
      try {
        await clearChatSessionMessages({ chatSessionId: sid, userId: req.user.id });
      } catch (err) {
        console.error('[Chat] clear session error:', err);
        return res.status(500).json({ error: err.message });
      }
    }
    res.json({ success: true, message: 'Session history cleared' });
});

// ─── WebSocket: Streaming Chat ────────────────────────────────────────────────
attachChatWebSocketServer({ server, developerMode });

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
    console.log('');
    console.log('🚀 Multi-Agent Orchestrator Server running!');
    console.log(`   REST API:  http://localhost:${PORT}/api`);
    console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`   Health:    http://localhost:${PORT}/api/health`);
    console.log('');
    console.log(`🔑 OpenAI API:  ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ NOT configured'}`);
    console.log(`📧 Gmail API:   ${isEmailConfigured() ? '✅ Configured' : '⚠️  Not configured (email tools disabled)'}`);
    console.log(`📅 Calendar API: ${isCalendarConfigured() ? '✅ Configured' : '⚠️  Not configured (calendar tools disabled)'}`);
    console.log(`✅ Tasks API:    ${isTasksConfigured() ? '✅ Configured' : '⚠️  Not configured (tasks tools disabled)'}`);
    console.log(`📰 News:        ✅ Ready (no API key needed)`);
    console.log(`🔍 Web Search:  ✅ Ready (no API key needed)`);
    console.log('');
});

export default app;
