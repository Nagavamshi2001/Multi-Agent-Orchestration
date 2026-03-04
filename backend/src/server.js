import './preload.js'; // dotenv + OPENAI_AGENTS_DISABLE_TRACING before any SDK load
import { createServer } from 'http';
import { initDb, cleanupExpiredSessions } from './db/db.js';
import { createApp } from './app.js';
import { attachChatWebSocketServer } from './ws/chatWsServer.js';
import { logger } from './utils/logger.js';
import { isEmailConfigured, isCalendarConfigured, isTasksConfigured, isYouTubeConfigured } from './utils/googleAuth.js';
import { config } from './config/index.js';

const app = createApp();
const server = createServer(app);
attachChatWebSocketServer({ server, developerMode: config.developerMode });

// Listen immediately so Render health checks get 200 as soon as the process is up (reduces 503 on cold start).
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
    youtubeConfigured: isYouTubeConfigured(),
  });

  initDb()
    .then(() => cleanupExpiredSessions().catch(() => {}))
    .then(() => logger.info('server.db.ready'))
    .catch((err) => logger.error('server.db.initFailed', { error: err.message }));
});

export default app;
