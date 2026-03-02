import './preload.js'; // dotenv + OPENAI_AGENTS_DISABLE_TRACING before any SDK load
import { createServer } from 'http';
import { initDb, cleanupExpiredSessions } from './db/db.js';
import { createApp } from './app.js';
import { attachChatWebSocketServer } from './ws/chatWsServer.js';
import { logger } from './utils/logger.js';
import { isEmailConfigured, isCalendarConfigured, isTasksConfigured } from './utils/googleAuth.js';
import { config } from './config/index.js';

await initDb();
cleanupExpiredSessions().catch(() => {});

const app = createApp();
const server = createServer(app);
attachChatWebSocketServer({ server, developerMode: config.developerMode });

server.listen(config.port, () => {
  const hasEnvOpenAI = !!process.env.OPENAI_API_KEY;
  logger.info('server.started', {
    port: config.port,
    frontendUrl: config.frontendUrl,
    openaiConfigured: hasEnvOpenAI,
    openaiNote: hasEnvOpenAI ? undefined : 'user keys in Settings still work',
    emailConfigured: isEmailConfigured(),
    calendarConfigured: isCalendarConfigured(),
    tasksConfigured: isTasksConfigured(),
  });
});

export default app;
