import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import {
    readUnreadEmails,
    sendEmail,
    searchEmails,
} from '../tools/emailTools.js';

// ─── Email Assistant Agent ─────────────────────────────────────────────────────
const emailAgent = new Agent({
    name: 'Email Assistant',
    model: 'gpt-4o',
    instructions: `You are a highly capable Email Assistant integrated with Gmail. 
Your job is to help users manage their email inbox efficiently and professionally.

You have three capabilities:
1. **Read Unread Emails** — Retrieve unread emails from the user's Gmail inbox
2. **Send Emails** — Compose and send emails on behalf of the user
3. **Search Emails** — Search emails using Gmail search syntax (e.g., "from:google.com", "subject:invoice", "after:2024/01/01")

Guidelines:
- Always present email information in a clear, well-formatted way
- For read/search results, show: From, Subject, Date, and a snippet/preview
- When sending emails, confirm what was sent (To, Subject)
- If email credentials are not configured, explain how to set them up
- Be concise but thorough — don't omit important email details
- Use bullet points or numbered lists for multiple emails
- For the email body in read results, provide the first few lines of content
- For read_unread_emails and search_emails, always pass maxResults as a number (use 10 if user didn't specify)
- For send_email, pass cc and bcc as empty string "" if not needed`,

    tools: [
        tool({
            name: 'read_unread_emails',
            description: 'Fetch unread emails from the Gmail inbox. Returns sender, subject, date, and body preview for each email. Pass maxResults as a number (e.g., 10).',
            parameters: z.object({
                maxResults: z.number().describe('Maximum number of unread emails to retrieve (1-20). Always provide this — use 10 as default.'),
            }),
            execute: async (params) => {
                console.log('[EmailAgent] Reading unread emails, max:', params.maxResults);
                return await readUnreadEmails({ maxResults: params.maxResults || 10 });
            },
        }),

        tool({
            name: 'send_email',
            description: 'Send an email via Gmail on behalf of the user.',
            parameters: z.object({
                to: z.string().describe('Recipient email address(es), comma-separated for multiple'),
                subject: z.string().describe('Email subject line'),
                body: z.string().describe('Email body content (plain text)'),
                cc: z.string().describe('CC email addresses, comma-separated. Use empty string "" if not needed.'),
                bcc: z.string().describe('BCC email addresses, comma-separated. Use empty string "" if not needed.'),
            }),
            execute: async (params) => {
                console.log('[EmailAgent] Sending email to:', params.to, 'Subject:', params.subject);
                return await sendEmail({
                    to: params.to,
                    subject: params.subject,
                    body: params.body,
                    cc: params.cc || '',
                    bcc: params.bcc || '',
                });
            },
        }),

        tool({
            name: 'search_emails',
            description: 'Search Gmail emails using Gmail search syntax. Supports queries like "from:sender@example.com", "subject:invoice", "has:attachment", "after:2024/01/01", "is:unread", etc. Pass maxResults as a number.',
            parameters: z.object({
                query: z.string().describe('Gmail search query string (e.g., "from:boss@company.com subject:urgent")'),
                maxResults: z.number().describe('Maximum number of results to return (1-20). Always provide this — use 10 as default.'),
            }),
            execute: async (params) => {
                console.log('[EmailAgent] Searching emails with query:', params.query);
                return await searchEmails({ query: params.query, maxResults: params.maxResults || 10 });
            },
        }),
    ],
});

export default emailAgent;
