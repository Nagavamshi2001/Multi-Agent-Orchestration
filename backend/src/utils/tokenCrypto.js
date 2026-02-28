import crypto from 'crypto';

const KEY_ENV = 'TOKEN_ENCRYPTION_KEY';

const getKey = () => {
  const raw = process.env[KEY_ENV];
  if (!raw) return null;
  // Prefer base64-encoded 32-byte key
  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length === 32) return buf;
  } catch {
    // ignore
  }
  // Fallback: treat as utf8 and hash to 32 bytes (allows easier dev setup)
  return crypto.createHash('sha256').update(String(raw), 'utf8').digest();
};

/**
 * Encrypt a secret string using AES-256-GCM.
 * @param {string} plaintext
 * @returns {string} base64 payload (iv|tag|ciphertext)
 */
export const encryptSecret = (plaintext) => {
  const key = getKey();
  if (!key) {
    throw new Error(`${KEY_ENV} is not configured`);
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
};

/**
 * Decrypt a payload created by encryptSecret().
 * @param {string} payloadBase64
 * @returns {string}
 */
export const decryptSecret = (payloadBase64) => {
  const key = getKey();
  if (!key) {
    throw new Error(`${KEY_ENV} is not configured`);
  }
  const buf = Buffer.from(String(payloadBase64), 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
};

