import { ObjectId } from 'mongodb';
import { getCollection, nowMs } from './client.js';
import { logger } from '../utils/logger.js';

const toId = (id) => (typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id) ? new ObjectId(id) : id);

const requireChatSessionOwner = async ({ chatSessionId, userId }) => {
  const chatSessions = getCollection('chat_sessions');
  const row = await chatSessions.findOne({ _id: toId(chatSessionId), user_id: userId });
  return !!row;
};

export const createChatSession = async ({ userId, title } = {}) => {
  if (!userId) throw new Error('userId is required');
  const ts = nowMs();
  const chatSessions = getCollection('chat_sessions');
  const result = await chatSessions.insertOne({
    user_id: userId,
    title: title || null,
    created_at: ts,
    updated_at: ts,
  });
  const id = result.insertedId.toString();
  logger.debug('db.chat_sessions.insert', { id, userId, title: title || null });
  return { id, title: title || null, createdAt: ts, updatedAt: ts };
};

export const ensureChatSession = async ({ chatSessionId, userId, title } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  const chatSessions = getCollection('chat_sessions');
  const sid = toId(chatSessionId);
  const existing = await chatSessions.findOne(
    { _id: sid },
    { projection: { title: 1 } }
  );
  const ts = nowMs();
  if (existing) {
    if (title && !existing.title) {
      await chatSessions.updateOne(
        { _id: sid, user_id: userId },
        { $set: { title, updated_at: ts } }
      );
      logger.debug('db.chat_sessions.ensure.updateTitle', { id: chatSessionId, userId, title });
    }
    return { id: existing._id.toString(), title: existing.title || null };
  }
  const result = await chatSessions.insertOne({
    user_id: userId,
    title: title || null,
    created_at: ts,
    updated_at: ts,
  });
  const newId = result.insertedId.toString();
  logger.debug('db.chat_sessions.ensure.insert', { id: newId, userId, title: title || null });
  return { id: newId, title: title || null };
};

export const renameChatSession = async ({ chatSessionId, userId, title } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  const ts = nowMs();
  const chatSessions = getCollection('chat_sessions');
  await chatSessions.updateOne(
    { _id: toId(chatSessionId), user_id: userId },
    { $set: { title: title || null, updated_at: ts } }
  );
};

export const deleteChatSessionById = async ({ chatSessionId, userId } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  const chatSessions = getCollection('chat_sessions');
  await chatSessions.deleteOne({ _id: toId(chatSessionId), user_id: userId });
};

export const clearChatSessionMessages = async ({ chatSessionId, userId } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  const isOwner = await requireChatSessionOwner({ chatSessionId, userId });
  if (!isOwner) return;
  const chatMessages = getCollection('chat_messages');
  const chatSessions = getCollection('chat_sessions');
  await chatMessages.deleteMany({ chat_session_id: chatSessionId });
  await chatSessions.updateOne(
    { _id: toId(chatSessionId), user_id: userId },
    { $set: { updated_at: nowMs() } }
  );
};

export const addChatMessage = async ({ chatSessionId, userId, role, content, agentName, videos, docs, sheets } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  if (!role) throw new Error('role is required');
  if (typeof content !== 'string' || !content.trim()) throw new Error('content is required');

  const session = await ensureChatSession({ chatSessionId, userId });
  const effectiveSessionId = session.id;

  const ts = nowMs();
  const chatMessages = getCollection('chat_messages');
  const chatSessions = getCollection('chat_sessions');
  const doc = {
    chat_session_id: effectiveSessionId,
    role,
    content,
    agent_name: agentName || null,
    created_at: ts,
  };
  if (Array.isArray(videos) && videos.length > 0) {
    doc.videos = videos;
  }
  if (Array.isArray(docs) && docs.length > 0) {
    doc.docs = docs;
  }
  if (Array.isArray(sheets) && sheets.length > 0) {
    doc.sheets = sheets;
  }
  const result = await chatMessages.insertOne(doc);
  const id = result.insertedId.toString();
  logger.debug('db.chat_messages.insert', {
    id,
    chatSessionId: effectiveSessionId,
    userId,
    role,
    hasContent: !!content,
    agentName: agentName || null,
  });

  const sid = toId(effectiveSessionId);
  if (role === 'user') {
    const sess = await chatSessions.findOne(
      { _id: sid, user_id: userId },
      { projection: { title: 1 } }
    );
    if (!sess?.title) {
      const snippet = content.trim().replace(/\s+/g, ' ').slice(0, 60);
      await chatSessions.updateOne(
        { _id: sid, user_id: userId },
        { $set: { title: snippet || null, updated_at: ts } }
      );
    } else {
      await chatSessions.updateOne(
        { _id: sid, user_id: userId },
        { $set: { updated_at: ts } }
      );
    }
  } else {
    await chatSessions.updateOne(
      { _id: sid, user_id: userId },
      { $set: { updated_at: ts } }
    );
  }

  return { id, createdAt: ts, sessionId: effectiveSessionId };
};

export const listChatSessionsByUserId = async ({ userId, limit = 50, offset = 0 } = {}) => {
  if (!userId) throw new Error('userId is required');
  const lim = Math.max(1, Math.min(200, Number(limit) || 50));
  const off = Math.max(0, Number(offset) || 0);
  const chatSessions = getCollection('chat_sessions');
  const cursor = chatSessions.aggregate([
    { $match: { user_id: userId } },
    {
      $lookup: {
        from: 'chat_messages',
        let: { sessionId: { $toString: '$_id' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$chat_session_id', '$$sessionId'] } } },
          { $sort: { created_at: -1 } },
          { $limit: 1 },
          { $project: { content: 1 } },
        ],
        as: 'lastMsg',
      },
    },
    { $match: { lastMsg: { $exists: true }, 'lastMsg.0': { $exists: true } } },
    {
      $project: {
        id: { $toString: '$_id' },
        title: 1,
        created_at: 1,
        updated_at: 1,
        last_message_preview: {
          $substr: [{ $arrayElemAt: ['$lastMsg.content', 0] }, 0, 120],
        },
      },
    },
    { $sort: { updated_at: -1 } },
    { $skip: off },
    { $limit: lim },
  ]);
  const rows = await cursor.toArray();
  return rows;
};

export const getChatMessagesBySessionId = async ({ chatSessionId, userId, limit = 200, offset = 0 } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  const isOwner = await requireChatSessionOwner({ chatSessionId, userId });
  if (!isOwner) return [];
  const lim = Math.max(1, Math.min(1000, Number(limit) || 200));
  const off = Math.max(0, Number(offset) || 0);
  const chatMessages = getCollection('chat_messages');
  const cursor = chatMessages.find(
    { chat_session_id: chatSessionId },
    { projection: { role: 1, content: 1, agent_name: 1, created_at: 1, videos: 1, docs: 1, sheets: 1 } }
  ).sort({ created_at: 1 }).skip(off).limit(lim);
  const rows = await cursor.toArray();
  return rows.map((r) => ({
    id: r._id.toString(),
    role: r.role,
    content: r.content,
    agent_name: r.agent_name,
    created_at: r.created_at,
    videos: r.videos || null,
    docs: r.docs || null,
    sheets: r.sheets || null,
  }));
};

export const getChatMessagesForAgentContext = async ({ chatSessionId, userId, limit = 20 } = {}) => {
  if (!chatSessionId) throw new Error('chatSessionId is required');
  if (!userId) throw new Error('userId is required');
  const isOwner = await requireChatSessionOwner({ chatSessionId, userId });
  if (!isOwner) return [];
  const lim = Math.max(1, Math.min(100, Number(limit) || 20));
  const chatMessages = getCollection('chat_messages');
  const cursor = chatMessages.find(
    { chat_session_id: chatSessionId },
    { projection: { role: 1, content: 1, _id: 0 } }
  ).sort({ created_at: -1 }).limit(lim);
  const rows = await cursor.toArray();
  return rows.reverse();
};
