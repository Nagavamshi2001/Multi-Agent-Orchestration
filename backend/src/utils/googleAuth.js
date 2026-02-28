import { google } from 'googleapis';
import { getContext } from '../auth/requestContext.js';

const PLAYGROUND_REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const bool = (v) => ['1', 'true', 'yes', 'on'].includes(String(v || '').toLowerCase());

const isDeveloperMode = () => {
  const ctx = getContext?.() || {};
  if (typeof ctx.developerMode === 'boolean') return ctx.developerMode;
  return bool(process.env.DEVELOPER_MODE);
};

const getClientId = () => process.env.GMAIL_CLIENT_ID;
const getClientSecret = () => process.env.GMAIL_CLIENT_SECRET;

export const getGoogleRefreshToken = () => {
  const dev = isDeveloperMode();
  const ctx = getContext?.() || {};
  return dev ? process.env.GMAIL_REFRESH_TOKEN : ctx.googleRefreshToken;
};

export const getGoogleUserEmail = () => {
  const dev = isDeveloperMode();
  const ctx = getContext?.() || {};
  return dev ? process.env.GMAIL_USER_EMAIL : ctx.googleUserEmail;
};

/**
 * Create OAuth2 client (shared by Gmail, Calendar, Tasks).
 * @returns {google.auth.OAuth2}
 */
export const createOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    getClientId(),
    getClientSecret(),
    PLAYGROUND_REDIRECT_URI
  );

  const refreshToken = getGoogleRefreshToken();
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }
  return oauth2Client;
};

/**
 * Check if Google OAuth credentials are configured.
 * @param {object} [opts]
 * @param {boolean} [opts.requireUserEmail] - If true, also requires GMAIL_USER_EMAIL (for Gmail send)
 * @returns {boolean}
 */
export const isGoogleConfigured = ({ requireUserEmail = false } = {}) => {
  const hasClient =
    getClientId() &&
    getClientSecret() &&
    getClientId() !== 'your-client-id.apps.googleusercontent.com';
  if (!hasClient) return false;

  const refreshToken = getGoogleRefreshToken();
  if (!refreshToken) return false;

  if (requireUserEmail) {
    return !!getGoogleUserEmail();
  }
  return true;
};

/**
 * Calendar API client.
 * @returns {Calendar}
 */
export const getCalendarClient = () => {
  const auth = createOAuth2Client();
  return google.calendar({ version: 'v3', auth });
};

/**
 * Gmail API client.
 * @returns {gmail_v1.Gmail}
 */
export const getGmailClient = () => {
  const auth = createOAuth2Client();
  return google.gmail({ version: 'v1', auth });
};

/**
 * Tasks API client.
 * @returns {tasks_v1.Tasks}
 */
export const getTasksClient = () => {
  const auth = createOAuth2Client();
  return google.tasks({ version: 'v1', auth });
};

/** @returns {boolean} */
export const isCalendarConfigured = () => isGoogleConfigured();

/** @returns {boolean} */
export const isTasksConfigured = () => isGoogleConfigured();

/** @returns {boolean} */
export const isEmailConfigured = () => isGoogleConfigured({ requireUserEmail: true });
