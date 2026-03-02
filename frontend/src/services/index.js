/**
 * API barrel: re-exports all service modules so callers can import from '@/services' or '@/services/api.js'.
 */
export { API_BASE, WS_BASE, WS_URL } from './apiClient.js';
export { default as api } from './apiClient.js';
export { checkHealth, sendMessage, clearSession, listChatSessions, createChatSession, getChatSessionMessages, renameChatSession, deleteChatSession } from './chat.js';
export { getMe, logout } from './auth.js';
export { sendMetricsFeedback, getMetricsSummary } from './metrics.js';
export { getMcpServers, saveMcpServer } from './mcp.js';
export { getSettings, saveSettings } from './settings.js';
