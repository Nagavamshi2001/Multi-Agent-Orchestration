import { google } from 'googleapis';
import { getContext } from '../auth/requestContext.js';

const PLAYGROUND_REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const bool = (v) => ['1', 'true', 'yes', 'on'].includes(String(v || '').toLowerCase());

/** Normalize expiry to milliseconds (Google may return seconds in some flows). */
function normalizeExpiryMs(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  return n > 0 && n < 1e12 ? n * 1000 : n;
}

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
 * Uses stored access token + expiry from context when available so API calls don't refresh every time.
 * @returns {google.auth.OAuth2}
 */
export const createOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    getClientId(),
    getClientSecret(),
    PLAYGROUND_REDIRECT_URI
  );

  const refreshToken = getGoogleRefreshToken();
  const ctx = getContext?.() || {};
  const accessToken = ctx.googleAccessToken || null;
  const expiryDate = normalizeExpiryMs(ctx.googleTokenExpiry);

  if (refreshToken) {
    const credentials = { refresh_token: refreshToken };
    const now = Date.now();
    if (accessToken && expiryDate != null && expiryDate > now) {
      credentials.access_token = accessToken;
      credentials.expiry_date = expiryDate;
    }
    oauth2Client.setCredentials(credentials);
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

/**
 * YouTube Data API v3 client.
 * @returns {youtube_v3.Youtube}
 */
export const getYouTubeClient = () => {
  const auth = createOAuth2Client();
  return google.youtube({ version: 'v3', auth });
};

/**
 * Google Docs API v1 client.
 * @returns {docs_v1.Docs}
 */
export const getDocsClient = () => {
  const auth = createOAuth2Client();
  return google.docs({ version: 'v1', auth });
};

/**
 * Google Sheets API v4 client.
 * @returns {sheets_v4.Sheets}
 */
export const getSheetsClient = () => {
  const auth = createOAuth2Client();
  return google.sheets({ version: 'v4', auth });
};

/**
 * Google Drive API v3 client.
 * @returns {drive_v3.Drive}
 */
export const getDriveClient = () => {
  const auth = createOAuth2Client();
  return google.drive({ version: 'v3', auth });
};

/** @returns {boolean} */
export const isCalendarConfigured = () => isGoogleConfigured();

/** @returns {boolean} */
export const isDocsConfigured = () => isGoogleConfigured();

/** @returns {boolean} */
export const isSheetsConfigured = () => isGoogleConfigured();

/** @returns {boolean} */
export const isTasksConfigured = () => isGoogleConfigured();

/** @returns {boolean} */
export const isYouTubeConfigured = () => isGoogleConfigured();

/** @returns {boolean} */
export const isEmailConfigured = () => isGoogleConfigured({ requireUserEmail: true });
