import {
  getGmailClient,
  getGoogleUserEmail,
  isEmailConfigured,
} from '../utils/googleAuth.js';
import { getHeader, extractBody } from '../utils/emailHelpers.js';
import { toolSuccess, toolError, toolEmpty } from '../utils/toolResponse.js';
import { clampMaxResults } from '../utils/helpers.js';

export { isEmailConfigured };

/** Build RFC 2822 MIME message and return base64url-encoded raw for Gmail API. */
function buildRawMessage({ fromEmail, to, subject, text, cc = '', bcc = '' }) {
  const lines = [];
  const rfc2822Date = new Date().toUTCString().replace('GMT', '+0000');
  lines.push(`From: <${fromEmail}>`);
  lines.push(`To: ${to}`);
  lines.push(`Subject: ${subject.replace(/\r?\n/g, ' ')}`);
  if (cc && cc.trim()) lines.push(`Cc: ${cc.trim()}`);
  if (bcc && bcc.trim()) lines.push(`Bcc: ${bcc.trim()}`);
  lines.push(`Date: ${rfc2822Date}`);
  lines.push('MIME-Version: 1.0');
  lines.push('Content-Type: text/plain; charset=UTF-8');
  lines.push('');
  lines.push(text || '');
  const raw = lines.join('\r\n');
  return Buffer.from(raw, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

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
// Uses Gmail API (same OAuth as read/search) to avoid SMTP 535 issues.
export const sendEmail = async ({ to, subject, body, cc = '', bcc = '' }) => {
  if (!isEmailConfigured()) {
    return toolError(
      'Gmail not configured or you are not logged in.',
      { setup: 'Login: /api/auth/google/start (or set DEVELOPER_MODE=true to use .env tokens)' }
    );
  }

  const userEmail = getGoogleUserEmail();
  if (!userEmail?.trim()) {
    return toolError(
      'No sending email in session. Sign in again with Google so we can send from your account.'
    );
  }

  try {
    const gmail = getGmailClient();
    const raw = buildRawMessage({
      fromEmail: userEmail,
      to,
      subject: subject || '(No subject)',
      text: body || '',
      cc,
      bcc,
    });
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    return toolSuccess({
      success: true,
      message: `Email sent successfully to ${to}`,
      messageId: res.data.id,
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
