import express from 'express';
import { google } from 'googleapis';
import { ObjectId } from 'mongodb';
import { encryptSecret } from '../utils/tokenCrypto.js';
import { upsertUserByGoogleSub, upsertGoogleTokens, createSession, deleteSession, getGoogleTokensByUserId } from '../db/db.js';
import { SESSION_COOKIE, getSessionIdFromReq } from './session.js';
import { logger } from '../utils/logger.js';

const OAUTH_STATE_COOKIE = 'sk_oauth_state';
const OAUTH_RETURN_COOKIE = 'sk_oauth_return';

const bool = (v) => ['1', 'true', 'yes', 'on'].includes(String(v || '').toLowerCase());

const getRedirectUri = (req) => {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${proto}://${req.get('host')}/api/auth/google/callback`;
};

/** True when the request is over HTTPS (e.g. behind Render's proxy). */
const isSecureRequest = (req) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return proto === 'https';
};

const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';

/** When frontend is on a different origin (HTTPS in prod), cookies must be SameSite=None; Secure for cross-origin requests. */
const getSessionCookieOptions = () => {
  const frontendUrl = getFrontendUrl();
  const isCrossOrigin = frontendUrl.startsWith('https://');
  return {
    httpOnly: true,
    sameSite: isCrossOrigin ? 'none' : 'lax',
    secure: isCrossOrigin,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
};

const getOAuthClient = (req) =>
  new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    getRedirectUri(req)
  );

const getScopes = () => [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
];

export const googleAuthRouter = () => {
  const router = express.Router();

  router.get('/google/start', (req, res) => {
    try {
      if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET. Set them in the backend environment (e.g. Render Dashboard → multi-agent-backend → Environment).' });
      }
      if (!process.env.TOKEN_ENCRYPTION_KEY) {
        return res.status(500).json({ error: 'Missing TOKEN_ENCRYPTION_KEY in backend .env (required to store refresh tokens)' });
      }

      const state = new ObjectId().toString();
      const returnTo = (req.query.returnTo && String(req.query.returnTo)) || getFrontendUrl();
      const secure = isSecureRequest(req);

      res.cookie(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: secure ? 'none' : 'lax',
        secure,
        path: '/api/auth',
        maxAge: 10 * 60 * 1000,
      });
      res.cookie(OAUTH_RETURN_COOKIE, returnTo, {
        httpOnly: true,
        sameSite: secure ? 'none' : 'lax',
        secure,
        path: '/api/auth',
        maxAge: 10 * 60 * 1000,
      });

      const oauth2Client = getOAuthClient(req);
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: getScopes(),
        state,
      });
      return res.redirect(url);
    } catch (err) {
      logger.error('oauth.start.error', { error: err.message, stack: err.stack });
      return res.status(500).json({ error: `OAuth start failed: ${err.message}` });
    }
  });

  router.get('/google/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];
      const returnTo = req.cookies?.[OAUTH_RETURN_COOKIE] || getFrontendUrl();

      if (!code || !state || !expectedState || String(state) !== String(expectedState)) {
        return res.status(400).send('Invalid OAuth state. Please retry login.');
      }

      const oauth2Client = getOAuthClient(req);
      const { tokens } = await oauth2Client.getToken(String(code));
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const me = await oauth2.userinfo.get();
      const profile = me.data || {};

      if (!profile.id || !profile.email) {
        return res.status(500).send('Failed to fetch Google user profile.');
      }

      const userId = await upsertUserByGoogleSub({
        googleSub: profile.id,
        email: profile.email,
        name: profile.name || '',
        picture: profile.picture || '',
      });

      const refreshToken = tokens.refresh_token;
      if (!refreshToken) {
        const existing = await getGoogleTokensByUserId(userId);
        if (!existing?.refresh_token_enc) {
          return res
            .status(400)
            .send(
              'Google did not return a refresh token. Please retry login (ensure prompt=consent) or revoke app access and try again.'
            );
        }
      }

      const refreshTokenEnc = refreshToken ? encryptSecret(refreshToken) : undefined;
      const accessTokenEnc = tokens.access_token ? encryptSecret(tokens.access_token) : undefined;
      const expiryDate = tokens.expiry_date ? Number(tokens.expiry_date) : undefined;

      await upsertGoogleTokens({
        userId,
        refreshTokenEnc,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        accessTokenEnc,
        expiryDate,
      });

      const session = await createSession({ userId });
      logger.info('oauth.callback.sessionCreated', {
        userId,
        email: profile.email,
        sessionId: session.id,
        expiresAt: session.expiresAt,
      });

      res.clearCookie(OAUTH_STATE_COOKIE, { path: '/api/auth' });
      res.clearCookie(OAUTH_RETURN_COOKIE, { path: '/api/auth' });

      res.cookie(SESSION_COOKIE, session.id, getSessionCookieOptions());

      return res.redirect(returnTo);
    } catch (err) {
      logger.error('oauth.callback.error', { error: err.message });
      return res.status(500).send(`OAuth callback failed: ${err.message}`);
    }
  });

  router.get('/me', async (req, res) => {
    // attachUser middleware sets req.user
    if (!req.user) return res.json({ user: null });
    return res.json({ user: req.user });
  });

  router.post('/logout', async (req, res) => {
    const sessionId = getSessionIdFromReq(req);
    if (sessionId) {
      await deleteSession(sessionId);
    }
    const opts = getSessionCookieOptions();
    res.clearCookie(SESSION_COOKIE, { path: opts.path, sameSite: opts.sameSite, secure: opts.secure });
    return res.json({ success: true });
  });

  return router;
};

