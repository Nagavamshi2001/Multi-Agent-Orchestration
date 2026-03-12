// Backwards-compatible barrel that re-exports from smaller DB modules.
export { initDb, isDbReady } from './client.js';
export {
  upsertUserByGoogleSub,
  getUserById,
  getUserByEmail,
  createUserWithPassword,
  updateUserPassword,
  upsertGoogleTokens,
  getGoogleTokensByUserId,
  unlinkGoogleFromUser,
} from './users.js';
export {
  createSession,
  deleteSession,
  getUserBySessionId,
  cleanupExpiredSessions,
} from './authSessions.js';
export {
  createChatSession,
  ensureChatSession,
  renameChatSession,
  deleteChatSessionById,
  clearChatSessionMessages,
  addChatMessage,
  listChatSessionsByUserId,
  getChatMessagesBySessionId,
  getChatMessagesForAgentContext,
} from './chatSessions.js';
export { recordChatMetric, getMetricsSummary } from './metrics.js';
export { getSettings, getSettingsWithKey, upsertSettings } from './userSettings.js';
