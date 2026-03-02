import api from './apiClient.js';

export async function sendMessage(message, sessionId) {
  const { data } = await api.post('/api/chat', { message, sessionId });
  return data;
}

export async function checkHealth() {
  const { data } = await api.get('/api/health');
  return data;
}

export async function clearSession(sessionId) {
  const { data } = await api.delete(`/api/chat/${sessionId}`);
  return data;
}

export async function listChatSessions() {
  const { data } = await api.get('/api/chat/sessions');
  return data;
}

export async function createChatSession(title) {
  const { data } = await api.post('/api/chat/sessions', title ? { title } : {});
  return data;
}

export async function getChatSessionMessages(chatSessionId) {
  const { data } = await api.get(`/api/chat/sessions/${encodeURIComponent(chatSessionId)}/messages`);
  return data;
}

export async function renameChatSession(chatSessionId, title) {
  const { data } = await api.patch(`/api/chat/sessions/${encodeURIComponent(chatSessionId)}`, { title });
  return data;
}

export async function deleteChatSession(chatSessionId) {
  const { data } = await api.delete(`/api/chat/sessions/${encodeURIComponent(chatSessionId)}`);
  return data;
}
