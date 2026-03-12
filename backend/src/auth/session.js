import { getUserBySessionId } from '../db/db.js';
import { logger } from '../utils/logger.js';

export const SESSION_COOKIE = 'sk_session';

const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';

/** When frontend is on a different origin (HTTPS in prod), cookies must be SameSite=None; Secure for cross-origin requests. */
export const getSessionCookieOptions = () => {
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

export const parseCookies = (cookieHeader) => {
  const out = {};
  if (!cookieHeader) return out;
  const parts = String(cookieHeader).split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(v);
  }
  return out;
};

export const getSessionIdFromReq = (req) => {
  if (req?.cookies?.[SESSION_COOKIE]) return req.cookies[SESSION_COOKIE];
  const header = req?.headers?.cookie;
  const cookies = parseCookies(header);
  return cookies[SESSION_COOKIE] || null;
};

export const attachUser = async (req, _res, next) => {
  const sessionId = getSessionIdFromReq(req);
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(sessionId)) {
    if (sessionId) logger.debug('session.attach.invalidId', { path: req.path, method: req.method });
    req.user = null;
    req.sessionId = null;
    return next();
  }
  logger.debug('session.attach.found', { sessionId, path: req.path, method: req.method });
  const user = await getUserBySessionId(sessionId);
  if (!user) {
    logger.info('session.attach.user.miss', { sessionId });
  } else {
    logger.debug('session.attach.user.hit', {
      sessionId,
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  }
  req.user = user;
  req.sessionId = sessionId;
  return next();
};

