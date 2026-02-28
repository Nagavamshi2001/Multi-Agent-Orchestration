import crypto from 'crypto';
import { exec, queryOne, queryAll, nowMs, persist } from './client.js';

const requireChatSessionOwner = ({ chatSessionId, userId }) => {
  const row = queryOne('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?;', [chatSessionId, userId]);
  return !!row?.id;
};

export const createChatSession = async ({ userId, title } = {}) => {
  if (!userId) throw new Error('userId is required');
  const id = crypto.randomUUID();
  const ts = nowMs();
  exec(
    'INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?);',
    [id, userId, title || null, ts, ts]
  );
  await persist();
  return { id, title: title || null, createdAt: ts, updatedAt: ts };
};

export const ensureChatSession = async ({ chatSessionId, userId, title } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  const existing = queryOne('SELECT id, title FROM chat_sessions WHERE id = ?;', [chatSessionId]);
  const ts = nowMs();
  if (existing?.id) {
    if (title && !existing.title) {
      exec('UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?;', [
        title,
        ts,
        chatSessionId,
        userId,
      ]);
      await persist();
    }
    return { id: chatSessionId, title: existing.title || null };
  }
  exec(
    'INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?);',
    [chatSessionId, userId, title || null, ts, ts]
  );
  await persist();
  return { id: chatSessionId, title: title || null };
};

export const renameChatSession = async ({ chatSessionId, userId, title } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  const ts = nowMs();
  exec('UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?;', [
    title || null,
    ts,
    chatSessionId,
    userId,
  ]);
  await persist();
};

export const deleteChatSessionById = async ({ chatSessionId, userId } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  exec('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?;', [chatSessionId, userId]);
  await persist();
};

export const clearChatSessionMessages = async ({ chatSessionId, userId } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  if (!requireChatSessionOwner({ chatSessionId, userId })) return;
  exec('DELETE FROM chat_messages WHERE chat_session_id = ?;', [chatSessionId]);
  exec('UPDATE chat_sessions SET updated_at = ? WHERE id = ? AND user_id = ?;', [nowMs(), chatSessionId, userId]);
  await persist();
};

export const addChatMessage = async ({ chatSessionId, userId, role, content, agentName } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  if (!role) throw new Error('role is required');
  if (typeof content !== 'string' || !content.trim()) throw new Error('content is required');

  await ensureChatSession({ chatSessionId, userId });

  const id = crypto.randomUUID();
  const ts = nowMs();
  exec(
    'INSERT INTO chat_messages (id, chat_session_id, role, content, agent_name, created_at) VALUES (?, ?, ?, ?, ?, ?);',
    [id, chatSessionId, role, content, agentName || null, ts]
  );

  // Best-effort title: first user message snippet
  if (role === 'user') {
    const titleRow = queryOne('SELECT title FROM chat_sessions WHERE id = ? AND user_id = ?;', [chatSessionId, userId]);
    if (!titleRow?.title) {
      const snippet = content.trim().replace(/\s+/g, ' ').slice(0, 60);
      exec('UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?;', [
        snippet || null,
        ts,
        chatSessionId,
        userId,
      ]);
    } else {
      exec('UPDATE chat_sessions SET updated_at = ? WHERE id = ? AND user_id = ?;', [ts, chatSessionId, userId]);
    }
  } else {
    exec('UPDATE chat_sessions SET updated_at = ? WHERE id = ? AND user_id = ?;', [ts, chatSessionId, userId]);
  }

  await persist();
  return { id, createdAt: ts };
};

export const listChatSessionsByUserId = async ({ userId, limit = 50, offset = 0 } = {}) => {
  if (!userId) throw new Error('userId is required');
  const lim = Math.max(1, Math.min(200, Number(limit) || 50));
  const off = Math.max(0, Number(offset) || 0);
  const rows = queryAll(
    `SELECT cs.id, cs.title, cs.created_at, cs.updated_at,
      (SELECT substr(m.content, 1, 120)
        FROM chat_messages m
        WHERE m.chat_session_id = cs.id
        ORDER BY m.created_at DESC
        LIMIT 1) AS last_message_preview
     FROM chat_sessions cs
     WHERE cs.user_id = ?
       AND EXISTS (SELECT 1 FROM chat_messages m2 WHERE m2.chat_session_id = cs.id)
     ORDER BY cs.updated_at DESC
     LIMIT ? OFFSET ?;`,
    [userId, lim, off]
  );
  return rows;
};

export const getChatMessagesBySessionId = async ({ chatSessionId, userId, limit = 200, offset = 0 } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  if (!requireChatSessionOwner({ chatSessionId, userId })) return [];
  const lim = Math.max(1, Math.min(1000, Number(limit) || 200));
  const off = Math.max(0, Number(offset) || 0);
  const rows = queryAll(
    `SELECT id, role, content, agent_name, created_at
     FROM chat_messages
     WHERE chat_session_id = ?
     ORDER BY created_at ASC
     LIMIT ? OFFSET ?;`,
    [chatSessionId, lim, off]
  );
  return rows;
};

export const getChatMessagesForAgentContext = async ({ chatSessionId, userId, limit = 20 } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  if (!requireChatSessionOwner({ chatSessionId, userId })) return [];
  const lim = Math.max(1, Math.min(100, Number(limit) || 20));
  // Fetch newest first, then reverse to chronological order
  const rows = queryAll(
    `SELECT role, content
     FROM chat_messages
     WHERE chat_session_id = ?
     ORDER BY created_at DESC
     LIMIT ?;`,
    [chatSessionId, lim]
  ).reverse();
  return rows;
};

