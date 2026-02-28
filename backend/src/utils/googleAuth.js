import { google } from 'googleapis';

const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

/**
 * Create OAuth2 client (shared by Gmail, Calendar, Tasks).
 * @returns {google.auth.OAuth2}
 */
export const createOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    REDIRECT_URI
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return oauth2Client;
};

/**
 * Check if Google OAuth credentials are configured.
 * @param {object} [opts]
 * @param {boolean} [opts.requireUserEmail] - If true, also requires GMAIL_USER_EMAIL (for Gmail send)
 * @returns {boolean}
 */
export const isGoogleConfigured = ({ requireUserEmail = false } = {}) => {
  const hasCredentials =
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    process.env.GMAIL_CLIENT_ID !== 'your-client-id.apps.googleusercontent.com';
  if (!hasCredentials) return false;
  if (requireUserEmail) {
    return !!process.env.GMAIL_USER_EMAIL;
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
