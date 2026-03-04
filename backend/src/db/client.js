import { MongoClient } from 'mongodb';
import { config } from '../config/index.js';

let client = null;
let db = null;

export const nowMs = () => Date.now();

async function createIndexes(database) {
  const users = database.collection('users');
  await users.createIndex({ google_sub: 1 }, { unique: true });

  const sessions = database.collection('sessions');
  await sessions.createIndex({ user_id: 1 });
  await sessions.createIndex({ expires_at: 1 });

  const chatSessions = database.collection('chat_sessions');
  await chatSessions.createIndex({ user_id: 1, updated_at: -1 });

  const chatMessages = database.collection('chat_messages');
  await chatMessages.createIndex({ chat_session_id: 1, created_at: 1 });

  const chatMetrics = database.collection('chat_metrics');
  await chatMetrics.createIndex({ user_id: 1, created_at: -1 });

  const googleTokens = database.collection('google_tokens');
  await googleTokens.createIndex({ user_id: 1 }, { unique: true });

  const userSettings = database.collection('user_settings');
  await userSettings.createIndex({ user_id: 1 }, { unique: true });
}

export const getDb = () => db;

export const getCollection = (name) => {
  if (!db) throw new Error('Database not initialized');
  return db.collection(name);
};

export const initDb = async () => {
  if (db) return db;
  const uri = config.mongodbUri;
  if (!uri || !uri.trim()) {
    throw new Error('MONGODB_URI is required');
  }
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  await createIndexes(db);
  return db;
};

export const isDbReady = () => !!db;
