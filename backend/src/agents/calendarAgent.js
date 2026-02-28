import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import {
  listUpcomingEvents,
  createEvent,
  deleteEvent,
  searchEvents,
  getEvent,
  updateEvent,
  listCalendars,
} from '../tools/calendarTools.js';

// ─── Google Calendar Assistant Agent ──────────────────────────────────────────
const calendarAgent = new Agent({
  name: 'Calendar Assistant',
  model: 'gpt-4o',
  instructions: `You are a highly capable Google Calendar Assistant.
Your job is to help users manage their calendar events efficiently.

You have seven capabilities:
1. **List Upcoming Events** — Show the user's upcoming events from their primary Google Calendar
2. **Create Event** — Create a new calendar event with title, start/end times, optional description and location
3. **Delete Event** — Delete an event by its ID
4. **Search Events** — Search events by keyword, date range, or both
5. **Get Event** — Fetch full details of a single event by its ID
6. **Update Event** — Modify an existing event (change title, time, description, or location)
7. **List Calendars** — List all calendars the user has access to

Guidelines:
- Always present event information in a clear, well-formatted way
- For list/search results, show: Summary, Start, End, Location (if any)
- When creating events, use ISO 8601 format for startDateTime and endDateTime (e.g., "2025-03-01T14:00:00Z")
- If the user says "tomorrow at 3pm", convert to the appropriate ISO datetime
- When creating events, always provide both startDateTime and endDateTime; if user doesn't specify end, assume 1 hour duration
- If calendar credentials are not configured, explain how to add the Calendar scope to OAuth
- Be concise but thorough — don't omit important event details
- Use bullet points or numbered lists for multiple events
- For list_upcoming_events and search_events, always pass maxResults as a number (use 10 if user didn't specify)`,
  tools: [
    tool({
      name: 'list_upcoming_events',
      description: 'List upcoming events from the user\'s primary Google Calendar. Returns event summary, start, end, and location.',
      parameters: z.object({
        maxResults: z.number().describe('Maximum number of events to retrieve (1-50). Use 10 as default.'),
      }),
      execute: async (params) => {
        console.log('[CalendarAgent] Listing upcoming events, max:', params.maxResults);
        return await listUpcomingEvents({ maxResults: params.maxResults || 10 });
      },
    }),

    tool({
      name: 'create_calendar_event',
      description: 'Create a new calendar event in the user\'s primary Google Calendar.',
      parameters: z.object({
        summary: z.string().describe('Event title/summary'),
        startDateTime: z.string().describe('Start time in ISO 8601 format (e.g., 2025-03-01T14:00:00Z)'),
        endDateTime: z.string().describe('End time in ISO 8601 format. If not provided by user, assume 1 hour after start.'),
        description: z.string().describe('Optional event description. Use empty string "" if not needed.'),
        location: z.string().describe('Optional event location. Use empty string "" if not needed.'),
      }),
      execute: async (params) => {
        console.log('[CalendarAgent] Creating event:', params.summary);
        return await createEvent({
          summary: params.summary,
          startDateTime: params.startDateTime,
          endDateTime: params.endDateTime || params.startDateTime,
          description: params.description || '',
          location: params.location || '',
        });
      },
    }),

    tool({
      name: 'delete_calendar_event',
      description: 'Delete a calendar event by its ID.',
      parameters: z.object({
        eventId: z.string().describe('The event ID to delete (from list or search results)'),
      }),
      execute: async (params) => {
        console.log('[CalendarAgent] Deleting event:', params.eventId);
        return await deleteEvent({ eventId: params.eventId });
      },
    }),

    tool({
      name: 'search_calendar_events',
      description: 'Search calendar events by keyword or date range. Supports query (keyword) and optional timeMin/timeMax in ISO format.',
      parameters: z.object({
        query: z.string().describe('Keyword to search. Use empty string "" if searching by date range only.'),
        timeMin: z.string().describe('Start of date range in ISO 8601. Use empty string "" if not needed.'),
        timeMax: z.string().describe('End of date range in ISO 8601. Use empty string "" if not needed.'),
        maxResults: z.number().describe('Maximum results. Use 10 as default.'),
      }),
      execute: async (params) => {
        console.log('[CalendarAgent] Searching events:', params.query || params.timeMin);
        return await searchEvents({
          query: params.query || '',
          timeMin: params.timeMin || undefined,
          timeMax: params.timeMax || undefined,
          maxResults: params.maxResults || 10,
        });
      },
    }),

    tool({
      name: 'get_calendar_event',
      description: 'Get full details of a single calendar event by its ID.',
      parameters: z.object({
        eventId: z.string().describe('The event ID (from list or search results)'),
        calendarId: z.string().optional().describe('Calendar ID. Default: primary.'),
      }),
      execute: async (params) => {
        console.log('[CalendarAgent] Getting event:', params.eventId);
        return await getEvent({
          eventId: params.eventId,
          calendarId: params.calendarId || 'primary',
        });
      },
    }),

    tool({
      name: 'update_calendar_event',
      description: 'Update an existing calendar event. Only provide fields to change; omit or use empty string to skip.',
      parameters: z.object({
        eventId: z.string().describe('The event ID to update'),
        summary: z.string().optional().describe('New event title.'),
        startDateTime: z.string().optional().describe('New start time (ISO 8601).'),
        endDateTime: z.string().optional().describe('New end time (ISO 8601).'),
        description: z.string().optional().describe('New description.'),
        location: z.string().optional().describe('New location.'),
        calendarId: z.string().optional().describe('Calendar ID. Default: primary.'),
      }),
      execute: async (params) => {
        console.log('[CalendarAgent] Updating event:', params.eventId);
        return await updateEvent({
          eventId: params.eventId,
          summary: params.summary || undefined,
          startDateTime: params.startDateTime || undefined,
          endDateTime: params.endDateTime || undefined,
          description: params.description,
          location: params.location,
          calendarId: params.calendarId || 'primary',
        });
      },
    }),

    tool({
      name: 'list_calendars',
      description: 'List all calendars the user has access to. Shows calendar IDs for switching between calendars.',
      parameters: z.object({}),
      execute: async () => {
        console.log('[CalendarAgent] Listing calendars');
        return await listCalendars();
      },
    }),
  ],
});

export default calendarAgent;
