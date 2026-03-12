/**
 * Backend API client. Re-exports from modular services for backwards compatibility.
 * New code may import from './services/chat', './services/auth', etc.
 */
export { API_BASE, WS_BASE, WS_URL } from './apiClient.js';
export { default } from './apiClient.js';
export { checkHealth, sendMessage, clearSession, listChatSessions, createChatSession, getChatSessionMessages, renameChatSession, deleteChatSession } from './chat.js';
export { getMe, logout, login, register, changePassword, disconnectGoogle } from './auth.js';
export { sendMetricsFeedback, getMetricsSummary } from './metrics.js';
export { getMcpServers, saveMcpServer } from './mcp.js';
export { getSettings, saveSettings } from './settings.js';
