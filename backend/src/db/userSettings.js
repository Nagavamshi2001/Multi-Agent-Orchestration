import { exec, queryOne, nowMs, persist } from './client.js';
import { encryptSecret, decryptSecret } from '../utils/tokenCrypto.js';

const DEFAULT_MODEL = 'gpt-4o';

export const getSettings = (userId) => {
  const row = queryOne(
    'SELECT user_id, openai_key_enc, openai_model FROM user_settings WHERE user_id = ?;',
    [userId]
  );
  if (!row) return null;
  return {
    userId: row.user_id,
    hasOpenaiKey: !!row.openai_key_enc,
    model: row.openai_model || DEFAULT_MODEL,
  };
};

export const getSettingsWithKey = (userId) => {
  const row = queryOne(
    'SELECT user_id, openai_key_enc, openai_model FROM user_settings WHERE user_id = ?;',
    [userId]
  );
  if (!row || !row.openai_key_enc) return null;
  let openaiApiKey = null;
  try {
    openaiApiKey = decryptSecret(row.openai_key_enc);
  } catch {
    return null;
  }
  return {
    userId: row.user_id,
    openaiApiKey,
    model: row.openai_model || DEFAULT_MODEL,
  };
};

export const upsertSettings = async (userId, { openaiApiKey, model }) => {
  const ts = nowMs();
  const existing = queryOne('SELECT user_id, openai_key_enc FROM user_settings WHERE user_id = ?;', [
    userId,
  ]);

  if (existing?.user_id) {
    let keyEnc = existing.openai_key_enc;
    if (openaiApiKey !== undefined) {
      if (openaiApiKey === null || openaiApiKey === '') {
        keyEnc = null;
      } else {
        keyEnc = encryptSecret(openaiApiKey);
      }
    }
    const modelVal = model !== undefined && model !== '' ? model : null;
    exec(
      'UPDATE user_settings SET openai_key_enc = ?, openai_model = ?, updated_at = ? WHERE user_id = ?;',
      [keyEnc, modelVal, ts, userId]
    );
  } else {
    const keyEnc =
      openaiApiKey && openaiApiKey !== '' ? encryptSecret(openaiApiKey) : null;
    const modelVal = model && model !== '' ? model : null;
    exec(
      'INSERT INTO user_settings (user_id, openai_key_enc, openai_model, created_at, updated_at) VALUES (?, ?, ?, ?, ?);',
      [userId, keyEnc, modelVal, ts, ts]
    );
  }
  await persist();
};
