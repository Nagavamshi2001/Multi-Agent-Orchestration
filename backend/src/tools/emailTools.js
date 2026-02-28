import nodemailer from 'nodemailer';
import {
  createOAuth2Client,
  getGmailClient,
  isEmailConfigured,
} from '../utils/googleAuth.js';
import { decodeBody, getHeader, extractBody } from '../utils/emailHelpers.js';
import { toolSuccess, toolError, toolEmpty } from '../utils/toolResponse.js';
import { clampMaxResults } from '../utils/helpers.js';

export { isEmailConfigured };

// ─── Tool: Read Unread Emails ─────────────────────────────────────────────────
export const readUnreadEmails = async ({ maxResults = 10 }) => {
  if (!isEmailConfigured()) {
    return toolError(
      'Gmail credentials not configured. Please set up your .env file with Gmail OAuth2 credentials.',
      { setup: 'See .env.example for instructions' }
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

    return JSON.stringify({ count: emails.length, emails });
  } catch (err) {
    console.error('[readUnreadEmails] Error:', err.message);
    return JSON.stringify({ error: `Failed to read emails: ${err.message}` });
  }
};

// ─── Tool: Send Email ─────────────────────────────────────────────────────────
export const sendEmail = async ({ to, subject, body, cc = '', bcc = '' }) => {
  if (!isEmailConfigured()) {
    return toolError(
      'Gmail credentials not configured. Please set up your .env file with Gmail OAuth2 credentials.'
    );
  }

  try {
    const auth = createOAuth2Client();
    const accessTokenRes = await auth.getAccessToken();
    const accessToken = accessTokenRes.token;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER_EMAIL,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken,
      },
    });

    const mailOptions = {
      from: `Me <${process.env.GMAIL_USER_EMAIL}>`,
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
    return JSON.stringify({
      error: 'Gmail credentials not configured. Please set up your .env file with Gmail OAuth2 credentials.',
    });
  }

  try {
    const gmail = getGmailClient();
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: Math.min(maxResults, 20),
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      return JSON.stringify({
        count: 0,
        emails: [],
        message: `No emails found matching: "${query}"`,
      });
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
