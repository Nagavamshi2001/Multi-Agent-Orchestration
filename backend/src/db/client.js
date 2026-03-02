import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'app.sqlite');

let SQL = null;
let db = null;
let dbPath = DEFAULT_DB_PATH;
let persistChain = Promise.resolve();

export const nowMs = () => Date.now();

const ensureDir = (filePath) => {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
};

const locateWasm = (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);

export const exec = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
};

export const queryOne = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
};

export const queryAll = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
};

export const persist = async () => {
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

    -- Chat history (separate from auth sessions)
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id_updated ON chat_sessions(user_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      chat_session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      agent_name TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(chat_session_id, created_at);

    -- Chat metrics for evaluation (latency, ratings, feedback)
    CREATE TABLE IF NOT EXISTS chat_metrics (
      id TEXT PRIMARY KEY,
      chat_session_id TEXT NOT NULL,
      user_id TEXT,
      latency_ms INTEGER NOT NULL,
      rating INTEGER,
      helpful INTEGER,
      feedback_text TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_chat_metrics_user_created ON chat_metrics(user_id, created_at DESC);
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

