import { getGoogleTokensByUserId } from '../db/db.js';
import { decryptSecret } from '../utils/tokenCrypto.js';

export const resolveGoogleContext = async ({ userId, userEmail, developerMode }) => {
  if (developerMode) {
    return {
      googleRefreshToken: process.env.GMAIL_REFRESH_TOKEN || null,
      googleUserEmail: process.env.GMAIL_USER_EMAIL || null,
    };
  }
  if (!userId) return { googleRefreshToken: null, googleUserEmail: null };
  const tokens = await getGoogleTokensByUserId(userId);
  const refreshEnc = tokens?.refresh_token_enc;
  return {
    googleRefreshToken: refreshEnc ? decryptSecret(refreshEnc) : null,
    googleUserEmail: userEmail || null,
  };
};

