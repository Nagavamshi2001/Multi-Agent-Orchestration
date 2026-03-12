import express from 'express';
import { config } from '../config/index.js';
import { isEmailConfigured, isCalendarConfigured, isTasksConfigured, isYouTubeConfigured, isDocsConfigured, isSheetsConfigured } from '../utils/googleAuth.js';

export const healthRouter = () => {
  const router = express.Router();

  router.get('/health', (req, res) => {
    const hasEnvKey = !!process.env.OPENAI_API_KEY;
    // When not in developer mode, users can add their own key in Settings, so consider configured
    const openaiConfigured = hasEnvKey || !config.developerMode;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      agents: [
        'orchestrator',
        'emailAssistant',
        'calendarAssistant',
        'tasksAssistant',
        'newsAssistant',
        'searchAssistant',
        'youtubeAssistant',
        'docsAssistant',
        'sheetsAssistant',
      ],
      emailConfigured: isEmailConfigured(),
      calendarConfigured: isCalendarConfigured(),
      tasksConfigured: isTasksConfigured(),
      youtubeConfigured: isYouTubeConfigured(),
      docsConfigured: isDocsConfigured(),
      sheetsConfigured: isSheetsConfigured(),
      openaiConfigured,
    });
  });

  return router;
};

