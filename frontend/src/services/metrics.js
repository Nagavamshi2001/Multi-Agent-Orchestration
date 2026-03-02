import api from './apiClient.js';

export async function sendMetricsFeedback({ chatSessionId, latencyMs, rating, helpful, feedbackText }) {
  const { data } = await api.post('/api/metrics/feedback', {
    chatSessionId,
    latencyMs,
    rating,
    helpful,
    feedbackText,
  });
  return data;
}

export async function getMetricsSummary() {
  const { data } = await api.get('/api/metrics/summary');
  return data;
}
