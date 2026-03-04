import { ObjectId } from 'mongodb';
import { getCollection, nowMs } from './client.js';
import { logger } from '../utils/logger.js';

export const createSession = async ({ userId, ttlMs }) => {
  const ts = nowMs();
  const expiresAt = ts + (ttlMs || 1000 * 60 * 60 * 24 * 7); // 7 days
  const sessions = getCollection('sessions');
  const result = await sessions.insertOne({
    user_id: userId,
    created_at: ts,
    expires_at: expiresAt,
  });
  const id = result.insertedId.toString();
  logger.debug('db.sessions.insert', { id, userId, expiresAt });
  return { id, expiresAt };
};

export const deleteSession = async (sessionId) => {
  if (typeof sessionId !== 'string' || !ObjectId.isValid(sessionId)) return;
  const sessions = getCollection('sessions');
  await sessions.deleteOne({ _id: new ObjectId(sessionId) });
  logger.debug('db.sessions.delete', { sessionId });
};

export const getUserBySessionId = async (sessionId) => {
  if (typeof sessionId !== 'string' || !ObjectId.isValid(sessionId)) {
    logger.debug('db.sessions.getUserBySessionId.invalidId', { sessionId: sessionId ? '[present]' : '[empty]' });
    return null;
  }
  const ts = nowMs();
  const sessions = getCollection('sessions');
  const session = await sessions.findOne({
    _id: new ObjectId(sessionId),
    expires_at: { $gt: ts },
  });
  if (!session) {
    logger.debug('db.sessions.getUserBySessionId.miss', { sessionId });
    return null;
  }
  const users = getCollection('users');
  const user = await users.findOne(
    { _id: new ObjectId(session.user_id) },
    { projection: { email: 1, name: 1, picture: 1 } }
  );
  if (!user) return null;
  logger.debug('db.sessions.getUserBySessionId.hit', {
    sessionId,
    userId: session.user_id,
    email: user.email,
  });
  return { id: session.user_id, email: user.email, name: user.name, picture: user.picture };
};

export const cleanupExpiredSessions = async () => {
  const ts = nowMs();
  const sessions = getCollection('sessions');
  const result = await sessions.deleteMany({ expires_at: { $lte: ts } });
  logger.info('db.sessions.cleanupExpired', { asOf: ts, deleted: result.deletedCount });
};
