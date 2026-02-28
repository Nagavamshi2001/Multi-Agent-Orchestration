import crypto from 'crypto';
import { exec, queryOne, nowMs, persist } from './client.js';

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

