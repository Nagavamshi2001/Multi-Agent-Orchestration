/**
 * Single source of truth for all tools used by the MCP server and by agents.
 * Flow: Orchestrator → Sub-agent → MCP tool layer (this registry) → tool implementation.
 */
import { z } from 'zod';
import {
  readUnreadEmails,
  sendEmail,
  searchEmails,
} from './emailTools.js';
import {
  listUpcomingEvents,
  listTodayEvents,
  createEvent,
  deleteEvent,
  getEvent,
  updateEvent,
  listCalendars,
  searchEvents,
} from './calendarTools.js';
import {
  listTaskLists,
  listTasks,
  createTask,
  completeTask,
  deleteTask,
} from './tasksTools.js';
import {
  getHeadlines,
  searchNews,
  getNewsByTopic,
  getNewsByLocation,
} from './newsTools.js';
import { webSearch } from './searchTools.js';
import {
  getMyChannel,
  listMyPlaylists,
  listPlaylistItems,
  searchVideos,
  searchMusic,
  getVideoDetails,
} from './youtubeTools.js';

/** @typedef {{ name: string, description: string, parameters: z.ZodType, execute: (params: any) => Promise<any> }} ToolDef */

function def(name, description, parameters, execute) {
  return { name, description, parameters, execute };
}

// ─── Email (MCP names) ───────────────────────────────────────────────────────
export const emailToolDefs = [
  def(
    'read_unread_emails',
    'Read unread emails from Gmail.',
    z.object({ maxResults: z.number().int().min(1).max(50).optional().nullable() }),
    readUnreadEmails
  ),
  def(
    'send_email',
    'Send an email via Gmail.',
    z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
      cc: z.string().optional().nullable(),
      bcc: z.string().optional().nullable(),
    }),
    sendEmail
  ),
  def(
    'search_emails',
    'Search emails in Gmail.',
    z.object({
      query: z.string(),
      maxResults: z.number().int().min(1).max(50).optional().nullable(),
    }),
    searchEmails
  ),
];

// ─── Calendar ─────────────────────────────────────────────────────────────────
export const calendarToolDefs = [
  def(
    'list_upcoming_events',
    "List upcoming events from the user's primary Google Calendar (events that start from now onward).",
    z.object({
      maxResults: z.number().int().min(1).max(50).optional().nullable(),
      calendarId: z.string().optional().nullable(),
    }),
    listUpcomingEvents
  ),
  def(
    'list_today_events',
    "List all events scheduled for today (full day from 00:00 to 23:59 UTC). Use this for 'what's on my calendar today', 'events today', or 'my schedule today'.",
    z.object({
      maxResults: z.number().int().min(1).max(50).optional().nullable(),
      calendarId: z.string().optional().nullable(),
    }),
    listTodayEvents
  ),
  def(
    'create_event',
    'Create a calendar event.',
    z.object({
      summary: z.string(),
      startDateTime: z.string(),
      endDateTime: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      calendarId: z.string().optional().nullable(),
    }),
    createEvent
  ),
  def(
    'delete_event',
    'Delete a calendar event.',
    z.object({
      eventId: z.string(),
      calendarId: z.string().optional().nullable(),
    }),
    deleteEvent
  ),
  def(
    'get_event',
    'Get details of a calendar event.',
    z.object({
      eventId: z.string(),
      calendarId: z.string().optional().nullable(),
    }),
    getEvent
  ),
  def(
    'update_event',
    'Update a calendar event.',
    z.object({
      eventId: z.string(),
      summary: z.string().optional().nullable(),
      startDateTime: z.string().optional().nullable(),
      endDateTime: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      calendarId: z.string().optional().nullable(),
    }),
    updateEvent
  ),
  def('list_calendars', 'List available calendars.', z.object({}), listCalendars),
  def(
    'search_events',
    'Search events by query and/or date range.',
    z.object({
      query: z.string().optional().nullable(),
      timeMin: z.string().optional().nullable(),
      timeMax: z.string().optional().nullable(),
      maxResults: z.number().int().min(1).max(50).optional().nullable(),
      calendarId: z.string().optional().nullable(),
    }),
    searchEvents
  ),
];

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksToolDefs = [
  def('list_task_lists', 'List Google Tasks task lists.', z.object({}), listTaskLists),
  def(
    'list_tasks',
    'List tasks in a task list.',
    z.object({
      taskListId: z.string().optional().nullable(),
      showCompleted: z.boolean().optional().nullable(),
      maxResults: z.number().int().min(1).max(100).optional().nullable(),
    }),
    listTasks
  ),
  def(
    'create_task',
    'Create a task in Google Tasks.',
    z.object({
      title: z.string(),
      notes: z.string().optional().nullable(),
      due: z.string().optional().nullable(),
      taskListId: z.string().optional().nullable(),
    }),
    createTask
  ),
  def(
    'complete_task',
    'Mark a task as completed.',
    z.object({
      taskId: z.string(),
      taskListId: z.string().optional().nullable(),
    }),
    completeTask
  ),
  def(
    'delete_task',
    'Delete a task.',
    z.object({
      taskId: z.string(),
      taskListId: z.string().optional().nullable(),
    }),
    deleteTask
  ),
];

// ─── News ────────────────────────────────────────────────────────────────────
export const newsToolDefs = [
  def(
    'news_headlines',
    'Get top news headlines.',
    z.object({
      maxResults: z.number().int().min(1).max(20).optional().nullable(),
      country: z.string().optional().nullable(),
      language: z.string().optional().nullable(),
    }),
    getHeadlines
  ),
  def(
    'search_news',
    'Search news articles.',
    z.object({
      query: z.string(),
      maxResults: z.number().int().min(1).max(20).optional().nullable(),
      country: z.string().optional().nullable(),
      language: z.string().optional().nullable(),
    }),
    searchNews
  ),
  def(
    'news_by_topic',
    'Get news by high-level topic (WORLD, BUSINESS, TECH, etc.).',
    z.object({
      topic: z.string(),
      maxResults: z.number().int().min(1).max(20).optional().nullable(),
      country: z.string().optional().nullable(),
      language: z.string().optional().nullable(),
    }),
    getNewsByTopic
  ),
  def(
    'news_by_location',
    'Get news by geographic location.',
    z.object({
      location: z.string(),
      maxResults: z.number().int().min(1).max(20).optional().nullable(),
      country: z.string().optional().nullable(),
      language: z.string().optional().nullable(),
    }),
    getNewsByLocation
  ),
];

// ─── Search ──────────────────────────────────────────────────────────────────
export const searchToolDefs = [
  def(
    'web_search',
    'Search the web using DuckDuckGo.',
    z.object({
      query: z.string(),
      maxResults: z.number().int().min(1).max(20).optional().nullable(),
    }),
    webSearch
  ),
];

// ─── YouTube ──────────────────────────────────────────────────────────────────
export const youtubeToolDefs = [
  def('get_my_channel', 'Get the logged-in user\'s YouTube channel (title, stats).', z.object({}), getMyChannel),
  def(
    'list_my_playlists',
    'List the user\'s YouTube playlists.',
    z.object({ maxResults: z.number().int().min(1).max(50).optional().nullable() }),
    listMyPlaylists
  ),
  def(
    'list_playlist_items',
    'List videos in a YouTube playlist.',
    z.object({
      playlistId: z.string(),
      maxResults: z.number().int().min(1).max(50).optional().nullable(),
    }),
    listPlaylistItems
  ),
  def(
    'search_videos',
    'Search YouTube for videos by query.',
    z.object({
      query: z.string(),
      maxResults: z.number().int().min(1).max(25).optional().nullable(),
    }),
    searchVideos
  ),
  def(
    'search_music',
    'Search for music/songs on YouTube (YouTube Music style). Use for play a song, find music, artist, album.',
    z.object({
      query: z.string(),
      maxResults: z.number().int().min(1).max(25).optional().nullable(),
    }),
    searchMusic
  ),
  def(
    'get_video_details',
    'Get details of a YouTube video by ID.',
    z.object({ videoId: z.string() }),
    getVideoDetails
  ),
];

/** All tool definitions for MCP server registration (name, description, inputSchema, handler). */
export function getAllMcpToolDefs() {
  return [
    ...emailToolDefs,
    ...calendarToolDefs,
    ...tasksToolDefs,
    ...newsToolDefs,
    ...searchToolDefs,
    ...youtubeToolDefs,
  ];
}
