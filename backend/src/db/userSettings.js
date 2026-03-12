import { getCollection, nowMs } from './client.js';
import { encryptSecret, decryptSecret } from '../utils/tokenCrypto.js';

const DEFAULT_MODEL = 'gpt-4o';

export const getSettings = async (userId) => {
  const userSettings = getCollection('user_settings');
  const row = await userSettings.findOne(
    { user_id: userId },
    { projection: { user_id: 1, openai_key_enc: 1, openai_model: 1, allow_agent_read_docs_sheets: 1 } }
  );
  if (!row) return null;
  return {
    userId: typeof row.user_id === 'string' ? row.user_id : row.user_id?.toString?.() ?? row.user_id,
    hasOpenaiKey: !!row.openai_key_enc,
    model: row.openai_model || DEFAULT_MODEL,
    allowAgentReadDocsSheets: row.allow_agent_read_docs_sheets === true,
  };
};

export const getSettingsWithKey = async (userId) => {
  const userSettings = getCollection('user_settings');
  const row = await userSettings.findOne(
    { user_id: userId },
    { projection: { user_id: 1, openai_key_enc: 1, openai_model: 1, allow_agent_read_docs_sheets: 1 } }
  );
  if (!row || !row.openai_key_enc) return null;
  let openaiApiKey = null;
  try {
    openaiApiKey = decryptSecret(row.openai_key_enc);
  } catch {
    return null;
  }
  return {
    userId: typeof row.user_id === 'string' ? row.user_id : row.user_id?.toString?.() ?? row.user_id,
    openaiApiKey,
    model: row.openai_model || DEFAULT_MODEL,
    allowAgentReadDocsSheets: row.allow_agent_read_docs_sheets === true,
  };
};

export const upsertSettings = async (userId, { openaiApiKey, model, allowAgentReadDocsSheets }) => {
  const ts = nowMs();
  const userSettings = getCollection('user_settings');
  const existing = await userSettings.findOne(
    { user_id: userId },
    { projection: { openai_key_enc: 1, allow_agent_read_docs_sheets: 1 } }
  );

  let keyEnc;
  let allowRead;
  if (existing) {
    keyEnc = existing.openai_key_enc;
    if (openaiApiKey !== undefined) {
      keyEnc = openaiApiKey === null || openaiApiKey === '' ? null : encryptSecret(openaiApiKey);
    }
    const modelVal = model !== undefined && model !== '' ? model : null;
    allowRead = allowAgentReadDocsSheets === undefined ? (existing.allow_agent_read_docs_sheets ?? false) : !!allowAgentReadDocsSheets;
    await userSettings.updateOne(
      { user_id: userId },
      { $set: { openai_key_enc: keyEnc, openai_model: modelVal, allow_agent_read_docs_sheets: allowRead, updated_at: ts } }
    );
  } else {
    keyEnc =
      openaiApiKey && openaiApiKey !== '' ? encryptSecret(openaiApiKey) : null;
    const modelVal = model && model !== '' ? model : null;
    allowRead = allowAgentReadDocsSheets === true;
    await userSettings.insertOne({
      user_id: userId,
      openai_key_enc: keyEnc,
      openai_model: modelVal,
      allow_agent_read_docs_sheets: allowRead,
      created_at: ts,
      updated_at: ts,
    });
  }
};
