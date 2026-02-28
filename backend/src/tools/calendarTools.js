import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// ─── Google Calendar OAuth2 Client ───────────────────────────────────────────
// Uses same OAuth2 credentials as Gmail; ensure refresh token includes Calendar scope:
// https://www.googleapis.com/auth/calendar
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

const getCalendarClient = () => {
  const auth = createOAuth2Client();
  return google.calendar({ version: 'v3', auth });
};

// ─── Check if credentials are configured ──────────────────────────────────────
export const isCalendarConfigured = () => {
  return !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    process.env.GMAIL_CLIENT_ID !== 'your-client-id.apps.googleusercontent.com'
  );
};

// ─── Tool: List Upcoming Events ───────────────────────────────────────────────
export const listUpcomingEvents = async ({ maxResults = 10, calendarId = 'primary' }) => {
  if (!isCalendarConfigured()) {
    return JSON.stringify({
      error: 'Calendar credentials not configured. Add Calendar scope to OAuth in .env (https://www.googleapis.com/auth/calendar)',
      setup: 'Re-authorize in OAuth Playground with calendar scope and update GMAIL_REFRESH_TOKEN',
    });
  }

  try {
    const calendar = getCalendarClient();
    const now = new Date();
    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      maxResults: Math.min(maxResults, 50),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    if (events.length === 0) {
      return JSON.stringify({ count: 0, events: [], message: 'No upcoming events found.' });
    }

    const formatted = events.map((ev) => {
      const start = ev.start?.dateTime || ev.start?.date;
      const end = ev.end?.dateTime || ev.end?.date;
      return {
        id: ev.id,
        summary: ev.summary || '(No title)',
        start,
        end,
        location: ev.location || null,
        description: ev.description ? ev.description.substring(0, 200) : null,
      };
    });

    return JSON.stringify({ count: formatted.length, events: formatted });
  } catch (err) {
    console.error('[listUpcomingEvents] Error:', err.message);
    return JSON.stringify({ error: `Failed to list events: ${err.message}` });
  }
};

// ─── Tool: Create Event ───────────────────────────────────────────────────────
export const createEvent = async ({
  summary,
  startDateTime,
  endDateTime,
  description = '',
  location = '',
  calendarId = 'primary',
}) => {
  if (!isCalendarConfigured()) {
    return JSON.stringify({
      error: 'Calendar credentials not configured. Add Calendar scope to OAuth.',
    });
  }

  if (!summary || !startDateTime) {
    return JSON.stringify({ error: 'summary and startDateTime are required.' });
  }

  try {
    const calendar = getCalendarClient();
    const event = {
      summary,
      description: description || undefined,
      location: location || undefined,
      start: {
        dateTime: startDateTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime || startDateTime,
        timeZone: 'UTC',
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return JSON.stringify({
      success: true,
      message: `Event "${summary}" created successfully.`,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    });
  } catch (err) {
    console.error('[createEvent] Error:', err.message);
    return JSON.stringify({ error: `Failed to create event: ${err.message}` });
  }
};

// ─── Tool: Delete Event ───────────────────────────────────────────────────────
export const deleteEvent = async ({ eventId, calendarId = 'primary' }) => {
  if (!isCalendarConfigured()) {
    return JSON.stringify({
      error: 'Calendar credentials not configured.',
    });
  }

  if (!eventId) {
    return JSON.stringify({ error: 'eventId is required.' });
  }

  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({
      calendarId,
      eventId,
    });
    return JSON.stringify({
      success: true,
      message: `Event ${eventId} deleted successfully.`,
    });
  } catch (err) {
    console.error('[deleteEvent] Error:', err.message);
    return JSON.stringify({ error: `Failed to delete event: ${err.message}` });
  }
};

// ─── Tool: Search Events (by date range or query) ──────────────────────────────
export const searchEvents = async ({
  query = '',
  timeMin,
  timeMax,
  maxResults = 10,
  calendarId = 'primary',
}) => {
  if (!isCalendarConfigured()) {
    return JSON.stringify({
      error: 'Calendar credentials not configured.',
    });
  }

  try {
    const calendar = getCalendarClient();
    const opts = {
      calendarId,
      maxResults: Math.min(maxResults, 50),
      singleEvents: true,
      orderBy: 'startTime',
    };
    if (query) opts.q = query;
    if (timeMin) opts.timeMin = timeMin;
    if (timeMax) opts.timeMax = timeMax;

    const response = await calendar.events.list(opts);
    const events = response.data.items || [];

    if (events.length === 0) {
      return JSON.stringify({
        count: 0,
        events: [],
        message: query ? `No events found matching "${query}".` : 'No events found in the given range.',
      });
    }

    const formatted = events.map((ev) => ({
      id: ev.id,
      summary: ev.summary || '(No title)',
      start: ev.start?.dateTime || ev.start?.date,
      end: ev.end?.dateTime || ev.end?.date,
      location: ev.location || null,
    }));

    return JSON.stringify({ count: formatted.length, query, events: formatted });
  } catch (err) {
    console.error('[searchEvents] Error:', err.message);
    return JSON.stringify({ error: `Failed to search events: ${err.message}` });
  }
};
