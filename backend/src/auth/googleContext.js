import { getGoogleTokensByUserId } from '../db/db.js';
import { decryptSecret } from '../utils/tokenCrypto.js';

/**
 * Resolve Google OAuth context for the current user (login already stored tokens).
 * Returns refresh + access token + expiry so tools use stored token and only refresh when expired.
 */
export const resolveGoogleContext = async ({ userId, userEmail, developerMode }) => {
  if (developerMode) {
    return {
      googleRefreshToken: process.env.GMAIL_REFRESH_TOKEN || null,
      googleUserEmail: process.env.GMAIL_USER_EMAIL || null,
      googleAccessToken: null,
      googleTokenExpiry: null,
    };
  }
  if (!userId) {
    return {
      googleRefreshToken: null,
      googleUserEmail: null,
      googleAccessToken: null,
      googleTokenExpiry: null,
    };
  }
  const tokens = await getGoogleTokensByUserId(userId);
  const refreshEnc = tokens?.refresh_token_enc;
  const accessEnc = tokens?.access_token_enc;
  const expiryDate = tokens?.expiry_date != null ? Number(tokens.expiry_date) : null;
  return {
    googleRefreshToken: refreshEnc ? decryptSecret(refreshEnc) : null,
    googleUserEmail: userEmail || null,
    googleAccessToken: accessEnc ? decryptSecret(accessEnc) : null,
    googleTokenExpiry: expiryDate,
  };
};

