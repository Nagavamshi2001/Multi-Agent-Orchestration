import initSqlJs from 'sql.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'app.sqlite');

let SQL = null;
let db = null;
let dbPath = DEFAULT_DB_PATH;
let persistChain = Promise.resolve();

const nowMs = () => Date.now();

const ensureDir = (filePath) => {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
};

const locateWasm = (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);

const exec = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
};

const queryOne = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
};

const queryAll = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
};

const persist = async () => {
  // serialize writes to disk
  persistChain = persistChain.then(async () => {
    ensureDir(dbPath);
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  });
  return persistChain;
};

const initSchema = () => {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_sub TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      picture TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS google_tokens (
      user_id TEXT PRIMARY KEY,
      refresh_token_enc TEXT NOT NULL,
      scope TEXT,
      token_type TEXT,
      access_token_enc TEXT,
      expiry_date INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  `);
};

export const initDb = async ({ filePath } = {}) => {
  if (db) return db;
  dbPath = filePath || process.env.DB_PATH || DEFAULT_DB_PATH;

  SQL = await initSqlJs({ locateFile: locateWasm });
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(new Uint8Array(buf));
  } else {
    db = new SQL.Database();
  }
  initSchema();
  await persist();
  return db;
};

export const isDbReady = () => !!db;

export const upsertUserByGoogleSub = async ({ googleSub, email, name, picture }) => {
  const existing = queryOne('SELECT id FROM users WHERE google_sub = ?;', [googleSub]);
  const ts = nowMs();
  if (existing?.id) {
    exec(
      'UPDATE users SET email = ?, name = ?, picture = ?, updated_at = ? WHERE id = ?;',
      [email, name || null, picture || null, ts, existing.id]
    );
    await persist();
    return existing.id;
  }
  const id = crypto.randomUUID();
  exec(
    'INSERT INTO users (id, google_sub, email, name, picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
    [id, googleSub, email, name || null, picture || null, ts, ts]
  );
  await persist();
  return id;
};

export const getUserById = async (userId) => {
  const row = queryOne('SELECT id, google_sub, email, name, picture FROM users WHERE id = ?;', [userId]);
  return row || null;
};

export const upsertGoogleTokens = async ({
  userId,
  refreshTokenEnc,
  scope,
  tokenType,
  accessTokenEnc,
  expiryDate,
}) => {
  const existing = queryOne('SELECT user_id, refresh_token_enc FROM google_tokens WHERE user_id = ?;', [userId]);
  const ts = nowMs();
  if (existing?.user_id) {
    exec(
      'UPDATE google_tokens SET refresh_token_enc = ?, scope = ?, token_type = ?, access_token_enc = ?, expiry_date = ?, updated_at = ? WHERE user_id = ?;',
      [
        refreshTokenEnc || existing.refresh_token_enc,
        scope || null,
        tokenType || null,
        accessTokenEnc || null,
        expiryDate || null,
        ts,
        userId,
      ]
    );
    await persist();
    return;
  }
  exec(
    'INSERT INTO google_tokens (user_id, refresh_token_enc, scope, token_type, access_token_enc, expiry_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
    [
      userId,
      refreshTokenEnc,
      scope || null,
      tokenType || null,
      accessTokenEnc || null,
      expiryDate || null,
      ts,
      ts,
    ]
  );
  await persist();
};

export const getGoogleTokensByUserId = async (userId) => {
  const row = queryOne(
    'SELECT user_id, refresh_token_enc, scope, token_type, access_token_enc, expiry_date FROM google_tokens WHERE user_id = ?;',
    [userId]
  );
  return row || null;
};

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
  return { id, expiresAt };
};

export const deleteSession = async (sessionId) => {
  exec('DELETE FROM sessions WHERE id = ?;', [sessionId]);
  await persist();
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
  return row || null;
};

export const cleanupExpiredSessions = async () => {
  const ts = nowMs();
  exec('DELETE FROM sessions WHERE expires_at <= ?;', [ts]);
  await persist();
};

