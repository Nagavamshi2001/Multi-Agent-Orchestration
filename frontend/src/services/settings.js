import api from './apiClient.js';

export async function getSettings() {
  const { data } = await api.get('/api/settings');
  return data;
}

export async function saveSettings({ openaiApiKey, model, allowAgentReadDocsSheets }) {
  const { data } = await api.put('/api/settings', {
    openaiApiKey,
    model,
    allowAgentReadDocsSheets,
  });
  return data;
}
