import express from 'express';
import { isEmailConfigured, isCalendarConfigured, isTasksConfigured } from '../utils/googleAuth.js';

export const healthRouter = () => {
  const router = express.Router();

  router.get('/health', (req, res) => {
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
      ],
      emailConfigured: isEmailConfigured(),
      calendarConfigured: isCalendarConfigured(),
      tasksConfigured: isTasksConfigured(),
      openaiConfigured: !!process.env.OPENAI_API_KEY,
    });
  });

  return router;
};

