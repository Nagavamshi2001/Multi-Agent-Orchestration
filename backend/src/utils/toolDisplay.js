/**
 * Human-readable labels for tool names (e.g. WebSocket trace messages, UI).
 * Single source of truth when adding new tools.
 */

const FRIENDLY_TOOL_MESSAGES = {
  read_unread_emails: 'Reading your unread emails...',
  send_email: 'Composing and sending email...',
  search_emails: 'Searching your inbox...',
  delegate_to_email_assistant: 'Consulting the Email Assistant...',
  list_upcoming_events: 'Fetching your upcoming events...',
  list_today_events: "Fetching today's events...",
  create_calendar_event: 'Creating calendar event...',
  delete_calendar_event: 'Deleting calendar event...',
  search_calendar_events: 'Searching your calendar...',
  get_calendar_event: 'Fetching event details...',
  update_calendar_event: 'Updating calendar event...',
  list_calendars: 'Listing your calendars...',
  delegate_to_calendar_assistant: 'Consulting the Calendar Assistant...',
  list_task_lists: 'Fetching your task lists...',
  list_tasks: 'Fetching your tasks...',
  create_task: 'Creating task...',
  complete_task: 'Marking task complete...',
  delete_task: 'Deleting task...',
  delegate_to_tasks_assistant: 'Consulting the Tasks Assistant...',
  get_headlines: 'Fetching headlines...',
  news_headlines: 'Fetching headlines...',
  search_news: 'Searching news...',
  get_news_by_topic: 'Fetching news by topic...',
  get_news_by_location: 'Fetching news by location...',
  delegate_to_news_assistant: 'Consulting the News Assistant...',
  web_search: 'Searching the web...',
  delegate_to_search_assistant: 'Consulting the Search Assistant...',
  get_my_channel: 'Fetching your YouTube channel...',
  list_my_playlists: 'Listing your playlists...',
  list_playlist_items: 'Loading playlist videos...',
  search_videos: 'Searching YouTube...',
  search_music: 'Searching for music...',
  get_video_details: 'Fetching video details...',
  delegate_to_youtube_assistant: 'Consulting the YouTube Assistant...',
  handoff_to_orchestrator: 'Returning to Orchestrator...',
};

/**
 * Get a human-readable message for a tool name (for traces / status).
 * @param {string} toolName - Tool name from the agent/SDK
 * @returns {string}
 */
export function getFriendlyToolMessage(toolName) {
  if (!toolName || toolName === 'action') return 'Executing action...';
  const formattedName = toolName.replace(/delegate_to_/g, '').replace(/_/g, ' ');
  return FRIENDLY_TOOL_MESSAGES[toolName] || `Executing ${formattedName}...`;
}

/**
 * Resolve tool name from a run stream item (tool_called / tool_output).
 * @param {object} item - Stream event item
 * @returns {string}
 */
export function getToolNameFromItem(item) {
  return item?.function?.name || item?.name || item?.rawItem?.name || item?.toolName || 'action';
}
