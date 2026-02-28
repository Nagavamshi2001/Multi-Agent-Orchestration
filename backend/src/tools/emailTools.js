import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─── Gmail OAuth2 Client ─────────────────────────────────────────────────────
const createOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return oauth2Client;
};

const getGmailClient = () => {
  const auth = createOAuth2Client();
  return google.gmail({ version: 'v1', auth });
};

// ─── Helper: Decode base64url email body ─────────────────────────────────────
const decodeBody = (str) => {
  if (!str) return '';
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
};

// ─── Helper: Extract header value ────────────────────────────────────────────
const getHeader = (headers, name) => {
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
};

// ─── Helper: Extract email body ──────────────────────────────────────────────
const extractBody = (payload) => {
  if (!payload) return '';
  if (payload.body?.data) return decodeBody(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBody(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBody(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }
  return '';
};

// ─── Check if credentials are configured ────────────────────────────────────
export const isEmailConfigured = () => {
  return !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    process.env.GMAIL_USER_EMAIL &&
    process.env.GMAIL_CLIENT_ID !== 'your-client-id.apps.googleusercontent.com'
  );
};

// ─── Tool: Read Unread Emails ─────────────────────────────────────────────────
export const readUnreadEmails = async ({ maxResults = 10 }) => {
  if (!isEmailConfigured()) {
    return JSON.stringify({
      error: 'Gmail credentials not configured. Please set up your .env file with Gmail OAuth2 credentials.',
      setup: 'See .env.example for instructions',
    });
  }

  try {
    const gmail = getGmailClient();
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: Math.min(maxResults, 20),
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      return JSON.stringify({ count: 0, emails: [], message: 'No unread emails found.' });
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
    return JSON.stringify({
      error: 'Gmail credentials not configured. Please set up your .env file with Gmail OAuth2 credentials.',
    });
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
    return JSON.stringify({
      success: true,
      message: `Email sent successfully to ${to}`,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('[sendEmail] Error:', err.message);
    return JSON.stringify({ error: `Failed to send email: ${err.message}` });
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

    return JSON.stringify({
      count: emails.length,
      query,
      emails,
    });
  } catch (err) {
    console.error('[searchEmails] Error:', err.message);
    return JSON.stringify({ error: `Failed to search emails: ${err.message}` });
  }
};
