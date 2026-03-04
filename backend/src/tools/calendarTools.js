import { getCalendarClient, isCalendarConfigured } from '../utils/googleAuth.js';
import { toolSuccess, toolError, toolEmpty } from '../utils/toolResponse.js';
import { safeTitle, clampMaxResults } from '../utils/helpers.js';

// Re-export for server.js
export { isCalendarConfigured };

// ─── Tool: List Upcoming Events ───────────────────────────────────────────────
export const listUpcomingEvents = async ({ maxResults = 10, calendarId = 'primary' }) => {
  if (!isCalendarConfigured()) {
    return toolError(
      'Calendar credentials not configured. Add Calendar scope to OAuth in .env (https://www.googleapis.com/auth/calendar)',
      { setup: 'Re-authorize in OAuth Playground with calendar scope and update GMAIL_REFRESH_TOKEN' }
    );
  }

  try {
    const calendar = getCalendarClient();
    const calId = calendarId || 'primary';
    const now = new Date();
    const response = await calendar.events.list({
      calendarId: calId,
      timeMin: now.toISOString(),
      maxResults: clampMaxResults(maxResults, 50),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    if (events.length === 0) {
      return toolEmpty('No upcoming events found.', { events: [] });
    }

    const formatted = events.map((ev) => {
      const start = ev.start?.dateTime || ev.start?.date;
      const end = ev.end?.dateTime || ev.end?.date;
      return {
        id: ev.id,
        summary: safeTitle(ev.summary),
        start,
        end,
        location: ev.location || null,
        description: ev.description ? ev.description.substring(0, 200) : null,
      };
    });

    return toolSuccess({ count: formatted.length, events: formatted });
  } catch (err) {
    console.error('[listUpcomingEvents] Error:', err.message);
    return toolError(`Failed to list events: ${err.message}`);
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
    return toolError('Calendar credentials not configured. Add Calendar scope to OAuth.');
  }

  if (!summary || !startDateTime) {
    return toolError('summary and startDateTime are required.');
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

    const calId = calendarId || 'primary';
    const response = await calendar.events.insert({
      calendarId: calId,
      requestBody: event,
    });

    return toolSuccess({
      success: true,
      message: `Event "${summary}" created successfully.`,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    });
  } catch (err) {
    console.error('[createEvent] Error:', err.message);
    return toolError(`Failed to create event: ${err.message}`);
  }
};

// ─── Tool: Delete Event ───────────────────────────────────────────────────────
export const deleteEvent = async ({ eventId, calendarId = 'primary' }) => {
  if (!isCalendarConfigured()) {
    return toolError('Calendar credentials not configured.');
  }

  if (!eventId) {
    return toolError('eventId is required.');
  }

  try {
    const calendar = getCalendarClient();
    const calId = calendarId || 'primary';
    await calendar.events.delete({
      calendarId: calId,
      eventId,
    });
    return toolSuccess({
      success: true,
      message: `Event ${eventId} deleted successfully.`,
    });
  } catch (err) {
    console.error('[deleteEvent] Error:', err.message);
    return toolError(`Failed to delete event: ${err.message}`);
  }
};

// ─── Tool: Get Event Details ───────────────────────────────────────────────────
export const getEvent = async ({ eventId, calendarId = 'primary' }) => {
  if (!isCalendarConfigured()) {
    return toolError('Calendar credentials not configured.');
  }

  if (!eventId) {
    return toolError('eventId is required.');
  }

  try {
    const calendar = getCalendarClient();
    const calId = calendarId || 'primary';
    const response = await calendar.events.get({
      calendarId: calId,
      eventId,
    });
    const ev = response.data;
    const start = ev.start?.dateTime || ev.start?.date;
    const end = ev.end?.dateTime || ev.end?.date;
    return toolSuccess({
      id: ev.id,
      summary: safeTitle(ev.summary),
      start,
      end,
      location: ev.location || null,
      description: ev.description || null,
      htmlLink: ev.htmlLink,
      status: ev.status,
      organizer: ev.organizer?.email || null,
      attendees: ev.attendees?.map((a) => a.email) || [],
      recurrence: ev.recurrence || null,
    });
  } catch (err) {
    console.error('[getEvent] Error:', err.message);
    return toolError(`Failed to get event: ${err.message}`);
  }
};

// ─── Tool: Update Event ────────────────────────────────────────────────────────
export const updateEvent = async ({
  eventId,
  summary,
  startDateTime,
  endDateTime,
  description,
  location,
  calendarId = 'primary',
}) => {
  if (!isCalendarConfigured()) {
    return toolError('Calendar credentials not configured.');
  }

  if (!eventId) {
    return toolError('eventId is required.');
  }

  try {
    const calendar = getCalendarClient();
    const body = {};
    if (summary != null && summary !== '') body.summary = summary;
    // Allow clearing by explicitly passing empty string
    if (description != null) body.description = description;
    if (location != null) body.location = location;
    if (startDateTime)
      body.start = { dateTime: startDateTime, timeZone: 'UTC' };
    if (endDateTime)
      body.end = { dateTime: endDateTime, timeZone: 'UTC' };

    if (Object.keys(body).length === 0) {
      return toolError('At least one field to update is required (summary, startDateTime, endDateTime, description, or location).');
    }

    const calId = calendarId || 'primary';
    const response = await calendar.events.patch({
      calendarId: calId,
      eventId,
      requestBody: body,
    });

    const ev = response.data;
    const start = ev.start?.dateTime || ev.start?.date;
    const end = ev.end?.dateTime || ev.end?.date;
    return toolSuccess({
      success: true,
      message: `Event "${ev.summary || eventId}" updated successfully.`,
      eventId: ev.id,
      summary: safeTitle(ev.summary),
      start,
      end,
      location: ev.location || null,
      htmlLink: ev.htmlLink,
    });
  } catch (err) {
    console.error('[updateEvent] Error:', err.message);
    return toolError(`Failed to update event: ${err.message}`);
  }
};

// ─── Tool: List Calendars ───────────────────────────────────────────────────────
export const listCalendars = async () => {
  if (!isCalendarConfigured()) {
    return toolError('Calendar credentials not configured.');
  }

  try {
    const calendar = getCalendarClient();
    const response = await calendar.calendarList.list();
    const calendars = response.data.items || [];

    if (calendars.length === 0) {
      return toolEmpty('No calendars found.', { calendars: [] });
    }

    const formatted = calendars.map((cal) => ({
      id: cal.id,
      summary: safeTitle(cal.summary),
      primary: cal.primary || false,
      accessRole: cal.accessRole,
      backgroundColor: cal.backgroundColor || null,
    }));

    return toolSuccess({ count: formatted.length, calendars: formatted });
  } catch (err) {
    console.error('[listCalendars] Error:', err.message);
    return toolError(`Failed to list calendars: ${err.message}`);
  }
};

// ─── Tool: List Today's Events (full day in UTC) ───────────────────────────────
export const listTodayEvents = async ({ maxResults = 50, calendarId = 'primary' }) => {
  if (!isCalendarConfigured()) {
    return toolError(
      'Calendar credentials not configured. Add Calendar scope to OAuth in .env (https://www.googleapis.com/auth/calendar)',
      { setup: 'Re-authorize in OAuth Playground with calendar scope and update GMAIL_REFRESH_TOKEN' }
    );
  }

  try {
    const calendar = getCalendarClient();
    const calId = calendarId || 'primary';
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const timeMin = `${y}-${m}-${d}T00:00:00.000Z`;
    const timeMax = `${y}-${m}-${d}T23:59:59.999Z`;

    const response = await calendar.events.list({
      calendarId: calId,
      timeMin,
      timeMax,
      maxResults: clampMaxResults(maxResults, 50),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    if (events.length === 0) {
      return toolEmpty('No events scheduled for today.', { events: [] });
    }

    const formatted = events.map((ev) => {
      const start = ev.start?.dateTime || ev.start?.date;
      const end = ev.end?.dateTime || ev.end?.date;
      return {
        id: ev.id,
        summary: safeTitle(ev.summary),
        start,
        end,
        location: ev.location || null,
        description: ev.description ? ev.description.substring(0, 200) : null,
      };
    });

    return toolSuccess({ count: formatted.length, events: formatted });
  } catch (err) {
    console.error('[listTodayEvents] Error:', err.message);
    return toolError(`Failed to list today's events: ${err.message}`);
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
    return toolError('Calendar credentials not configured.');
  }

  try {
    const calendar = getCalendarClient();
    const calId = calendarId || 'primary';
    const opts = {
      calendarId: calId,
      maxResults: clampMaxResults(maxResults, 50),
      singleEvents: true,
      orderBy: 'startTime',
    };
    if (query) opts.q = query;
    if (timeMin) opts.timeMin = timeMin;
    if (timeMax) opts.timeMax = timeMax;

    const response = await calendar.events.list(opts);
    const events = response.data.items || [];

    if (events.length === 0) {
      return toolEmpty(
        query ? `No events found matching "${query}".` : 'No events found in the given range.',
        { events: [], query }
      );
    }

    const formatted = events.map((ev) => ({
      id: ev.id,
      summary: safeTitle(ev.summary),
      start: ev.start?.dateTime || ev.start?.date,
      end: ev.end?.dateTime || ev.end?.date,
      location: ev.location || null,
    }));

    return toolSuccess({ count: formatted.length, query, events: formatted });
  } catch (err) {
    console.error('[searchEvents] Error:', err.message);
    return toolError(`Failed to search events: ${err.message}`);
  }
};
