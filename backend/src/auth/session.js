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
    req.user = null;
    req.sessionId = null;
    return next();
  }
  const user = await getUserBySessionId(sessionId);
  req.user = user;
  req.sessionId = sessionId;
  return next();
};

