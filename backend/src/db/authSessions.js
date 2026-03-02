import crypto from 'crypto';
import { exec, queryOne, nowMs, persist } from './client.js';
import { logger } from '../utils/logger.js';

export const createSession = async ({ userId, ttlMs }) => {
  const id = crypto.randomUUID();
  const ts = nowMs();
  const expiresAt = ts + (ttlMs || 1000 * 60 * 60 * 24 * 7); // 7 days
  exec('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?);', [
    id,
    userId,
    ts,
    expiresAt,
  ]);
  await persist();
  logger.debug('db.sessions.insert', { id, userId, expiresAt });
  return { id, expiresAt };
};

export const deleteSession = async (sessionId) => {
  exec('DELETE FROM sessions WHERE id = ?;', [sessionId]);
  await persist();
  logger.debug('db.sessions.delete', { sessionId });
};

export const getUserBySessionId = async (sessionId) => {
  const ts = nowMs();
  const row = queryOne(
    `SELECT u.id as id, u.email as email, u.name as name, u.picture as picture
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?;`,
    [sessionId, ts]
  );
  if (!row) {
    logger.debug('db.sessions.getUserBySessionId.miss', { sessionId });
  } else {
    logger.debug('db.sessions.getUserBySessionId.hit', { sessionId, userId: row.id, email: row.email });
  }
  return row || null;
};

export const cleanupExpiredSessions = async () => {
  const ts = nowMs();
  exec('DELETE FROM sessions WHERE expires_at <= ?;', [ts]);
  await persist();
  logger.info('db.sessions.cleanupExpired', { asOf: ts });
};

