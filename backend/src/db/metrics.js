import { getCollection, nowMs } from './client.js';
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

  const ts = nowMs();
  const helpfulVal = helpful === true ? 1 : helpful === false ? 0 : null;

  const chatMetrics = getCollection('chat_metrics');
  const result = await chatMetrics.insertOne({
    chat_session_id: chatSessionId,
    user_id: userId || null,
    latency_ms: latencyMs,
    rating,
    helpful: helpfulVal,
    feedback_text: feedbackText || null,
    created_at: ts,
  });
  const id = result.insertedId.toString();

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
  const chatMetrics = getCollection('chat_metrics');
  const match = userId ? { user_id: userId } : {};
  const rows = await chatMetrics
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avg_latency: { $avg: '$latency_ms' },
          avg_rating: { $avg: '$rating' },
        },
      },
      { $project: { _id: 0, total: 1, avg_latency: 1, avg_rating: 1 } },
    ])
    .toArray();
  const row = rows[0] || {};
  return {
    total: Number(row.total || 0),
    avgLatency: row.avg_latency != null ? Number(row.avg_latency) : null,
    avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
  };
};
