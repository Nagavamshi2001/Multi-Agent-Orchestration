// Backwards-compatible barrel that re-exports from smaller DB modules.
export { initDb, isDbReady } from './client.js';
export {
  upsertUserByGoogleSub,
  getUserById,
  upsertGoogleTokens,
  getGoogleTokensByUserId,
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
