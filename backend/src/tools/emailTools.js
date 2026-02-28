import nodemailer from 'nodemailer';
import {
  createOAuth2Client,
  getGmailClient,
  getGoogleRefreshToken,
  getGoogleUserEmail,
  isEmailConfigured,
} from '../utils/googleAuth.js';
import { getHeader, extractBody } from '../utils/emailHelpers.js';
import { toolSuccess, toolError, toolEmpty } from '../utils/toolResponse.js';
import { clampMaxResults } from '../utils/helpers.js';

export { isEmailConfigured };

// ─── Tool: Read Unread Emails ─────────────────────────────────────────────────
export const readUnreadEmails = async ({ maxResults = 10 }) => {
  if (!isEmailConfigured()) {
    return toolError(
      'Gmail not configured or you are not logged in.',
      { setup: 'Login: /api/auth/google/start (or set DEVELOPER_MODE=true to use .env tokens)' }
    );
  }

  try {
    const gmail = getGmailClient();
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: clampMaxResults(maxResults, 20),
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      return toolEmpty('No unread emails found.', { emails: [] });
    }

    const emails = await Promise.all(
      messages.map(async ({ id }) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id,
          format: 'full',
        });
        const headers = msg.data.payload?.headers || [];
        const body = extractBody(msg.data.payload);
        return {
          id,
          from: getHeader(headers, 'From'),
          to: getHeader(headers, 'To'),
          subject: getHeader(headers, 'Subject'),
          date: getHeader(headers, 'Date'),
          snippet: msg.data.snippet || '',
          body: body.substring(0, 500) + (body.length > 500 ? '...' : ''),
        };
      })
    );

    return toolSuccess({ count: emails.length, emails });
  } catch (err) {
    console.error('[readUnreadEmails] Error:', err.message);
    return toolError(`Failed to read emails: ${err.message}`);
  }
};

// ─── Tool: Send Email ─────────────────────────────────────────────────────────
export const sendEmail = async ({ to, subject, body, cc = '', bcc = '' }) => {
  if (!isEmailConfigured()) {
    return toolError(
      'Gmail not configured or you are not logged in.',
      { setup: 'Login: /api/auth/google/start (or set DEVELOPER_MODE=true to use .env tokens)' }
    );
  }

  try {
    const auth = createOAuth2Client();
    const accessTokenRes = await auth.getAccessToken();
    const accessToken = accessTokenRes.token;
    const userEmail = getGoogleUserEmail();
    const refreshToken = getGoogleRefreshToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: userEmail,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken,
        accessToken,
      },
    });

    const mailOptions = {
      from: `Me <${userEmail}>`,
      to,
      subject,
      text: body,
      ...(cc && { cc }),
      ...(bcc && { bcc }),
    };

    const result = await transporter.sendMail(mailOptions);
    return toolSuccess({
      success: true,
      message: `Email sent successfully to ${to}`,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('[sendEmail] Error:', err.message);
    return toolError(`Failed to send email: ${err.message}`);
  }
};

// ─── Tool: Search Emails ──────────────────────────────────────────────────────
export const searchEmails = async ({ query, maxResults = 10 }) => {
  if (!isEmailConfigured()) {
    return toolError(
      'Gmail not configured or you are not logged in.',
      { setup: 'Login: /api/auth/google/start (or set DEVELOPER_MODE=true to use .env tokens)' }
    );
  }

  try {
    const gmail = getGmailClient();
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: clampMaxResults(maxResults, 20),
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      return toolEmpty(`No emails found matching: "${query}"`, { emails: [], query });
    }

    const emails = await Promise.all(
      messages.map(async ({ id }) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        });
        const headers = msg.data.payload?.headers || [];
        return {
          id,
          from: getHeader(headers, 'From'),
          to: getHeader(headers, 'To'),
          subject: getHeader(headers, 'Subject'),
          date: getHeader(headers, 'Date'),
          snippet: msg.data.snippet || '',
          labels: msg.data.labelIds || [],
        };
      })
    );

    return toolSuccess({
      count: emails.length,
      query,
      emails,
    });
  } catch (err) {
    console.error('[searchEmails] Error:', err.message);
    return toolError(`Failed to search emails: ${err.message}`);
  }
};
