import express from 'express';
import { recordChatMetric, getMetricsSummary } from '../db/db.js';
import { logger } from '../utils/logger.js';

const requireUser = (req, res) => {
  if (req.user?.id) return true;
  res.status(401).json({ error: 'Authentication required' });
  return false;
};

export const metricsRouter = () => {
  const router = express.Router();

  router.post('/metrics/feedback', async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      const { chatSessionId, latencyMs, rating, helpful, feedbackText } = req.body || {};
      if (!chatSessionId) {
        return res.status(400).json({ error: 'chatSessionId is required' });
      }

      const metric = await recordChatMetric({
        chatSessionId,
        userId: req.user.id,
        latencyMs: typeof latencyMs === 'number' && latencyMs >= 0 ? latencyMs : 0,
        rating: typeof rating === 'number' ? rating : null,
        helpful: typeof helpful === 'boolean' ? helpful : null,
        feedbackText: typeof feedbackText === 'string' ? feedbackText.slice(0, 500) : null,
      });

      logger.info('metrics.feedback.recorded', {
        userId: req.user.id,
        chatSessionId,
        metricId: metric.id,
        hasRating: typeof rating === 'number',
        hasHelpful: typeof helpful === 'boolean',
        hasFeedbackText: typeof feedbackText === 'string' && feedbackText.length > 0,
      });

      return res.json({ success: true, metricId: metric.id });
    } catch (err) {
      logger.error('metrics.feedback.error', {
        userId: req.user?.id || null,
        error: err.message,
      });
      return res.status(500).json({ error: err.message });
    }
  });

  router.get('/metrics/summary', async (req, res) => {
    try {
      const summary = await getMetricsSummary({ userId: req.user?.id || null });
      logger.debug('metrics.summary', {
        userId: req.user?.id || null,
        summary,
      });
      return res.json({ summary });
    } catch (err) {
      logger.error('metrics.summary.error', {
        userId: req.user?.id || null,
        error: err.message,
      });
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
};

