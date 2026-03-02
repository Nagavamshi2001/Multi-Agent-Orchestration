import { getUserBySessionId } from '../db/db.js';

export const SESSION_COOKIE = 'sk_session';

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
  if (!sessionId) {
    console.log('[Session] No sk_session cookie on request');
    req.user = null;
    req.sessionId = null;
    return next();
  }
  console.log('[Session] Found sk_session cookie:', sessionId);
  const user = await getUserBySessionId(sessionId);
  if (!user) {
    console.log('[Session] No active user for session id (may be expired or missing in DB):', sessionId);
  } else {
    console.log('[Session] Attached user from session:', {
      id: user.id,
      email: user.email,
      name: user.name,
    });
  }
  req.user = user;
  req.sessionId = sessionId;
  return next();
};

