import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import {
  initDb,
  cleanupExpiredSessions,
} from './db/db.js';
import { attachUser } from './auth/session.js';
import { googleAuthRouter } from './auth/googleRoutes.js';
import { attachChatWebSocketServer } from './ws/chatWsServer.js';
import { logger } from './utils/logger.js';
import { isEmailConfigured, isCalendarConfigured, isTasksConfigured } from './utils/googleAuth.js';
import { chatRouter } from './routes/chatRoutes.js';
import { metricsRouter } from './routes/metricsRoutes.js';
import { healthRouter } from './routes/healthRoutes.js';

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

// ─── Auth & Feature Routes ────────────────────────────────────────────────────
app.use('/api/auth', googleAuthRouter());
app.use('/api', healthRouter());
app.use('/api', chatRouter({ developerMode }));
app.use('/api', metricsRouter());

// ─── WebSocket: Streaming Chat ────────────────────────────────────────────────
attachChatWebSocketServer({ server, developerMode });

// ─── Global Error Handler (fallback) ──────────────────────────────────────────
// Note: most routes already handle errors explicitly. This is a safety net.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('http.unhandled', {
    path: req.path,
    method: req.method,
    userId: req.user?.id || null,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  const status = err.status || 500;
  const safeMessage =
    status >= 500
      ? 'Internal server error. Please try again later.'
      : err.message || 'Request failed';

  res.status(status).json({ error: safeMessage });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
    logger.info('server.started', {
      port: PORT,
      frontendUrl: FRONTEND_URL,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      emailConfigured: isEmailConfigured(),
      calendarConfigured: isCalendarConfigured(),
      tasksConfigured: isTasksConfigured(),
    });
});

export default app;
