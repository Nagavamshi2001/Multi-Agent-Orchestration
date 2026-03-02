import crypto from 'crypto';
import { exec, queryAll, nowMs, persist } from './client.js';
import { logger } from '../utils/logger.js';

export const recordChatMetric = async ({
  chatSessionId,
  userId,
  latencyMs,
  rating = null,
  helpful = null,
  feedbackText = null,
} = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (typeof latencyMs !== 'number' || latencyMs < 0) throw new Error('latencyMs must be a non-negative number');

  const id = crypto.randomUUID();
  const ts = nowMs();

  exec(
    `INSERT INTO chat_metrics (id, chat_session_id, user_id, latency_ms, rating, helpful, feedback_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, chatSessionId, userId || null, latencyMs, rating, helpful ? 1 : helpful === false ? 0 : null, feedbackText || null, ts]
  );

  await persist();
  logger.debug('db.chat_metrics.insert', {
    id,
    chatSessionId,
    userId: userId || null,
    latencyMs,
    hasRating: rating != null,
    helpful,
    hasFeedbackText: typeof feedbackText === 'string' && feedbackText.length > 0,
  });
  return { id, createdAt: ts };
};

export const getMetricsSummary = async ({ userId } = {}) => {
  const rows = queryAll(
    `SELECT
       COUNT(*) AS total,
       AVG(latency_ms) AS avg_latency,
       AVG(CASE WHEN rating IS NOT NULL THEN rating END) AS avg_rating
     FROM chat_metrics
     WHERE (? IS NULL OR user_id = ?);`,
    [userId || null, userId || null]
  );

  const row = rows[0] || {};
  return {
    total: Number(row.total || 0),
    avgLatency: row.avg_latency != null ? Number(row.avg_latency) : null,
    avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
  };
};

