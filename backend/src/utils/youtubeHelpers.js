/**
 * Reusable YouTube helpers: normalized video shape, parsing tool results, stream item handling.
 * Used by youtubeTools.js and chatWsServer.js.
 */
import { safeTitle } from './helpers.js';

/** Tool names that return a `videos` array (for WebSocket attachment and UI). */
export const YOUTUBE_VIDEO_TOOLS = ['search_videos', 'search_music', 'list_playlist_items'];

/** YouTube Assistant agent name (for attaching videos to response). */
export const YOUTUBE_AGENT_NAME = 'YouTube Assistant';

/**
 * Build normalized video item for UI (id, title, thumbnailUrl, channelTitle, duration).
 * @param {object} item - Raw item from YouTube API (search, playlistItems, or videos.list)
 * @returns {{ id: string, title: string, thumbnailUrl: string|null, channelTitle: string|null, duration?: string }}
 */
export function toNormalizedVideo(item) {
  const snippet = item.snippet || {};
  const thumb = snippet.thumbnails?.medium || snippet.thumbnails?.default || {};
  const videoId = item.id?.videoId || item.id || item.snippet?.resourceId?.videoId;
  const duration = item.contentDetails?.duration || null;
  return {
    id: videoId,
    title: safeTitle(snippet.title),
    thumbnailUrl: thumb.url || null,
    channelTitle: snippet.channelTitle || null,
    duration: duration || undefined,
  };
}

/**
 * Parse tool result JSON and extract videos array if present (for WebSocket attachment).
 * @param {string|object} resultJson - Tool return value (stringified JSON or object)
 * @returns {Array|null} Normalized videos array or null
 */
export function extractVideosFromToolResult(resultJson) {
  try {
    const data = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
    if (data && Array.isArray(data.videos) && data.videos.length > 0) {
      return data.videos;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get tool output text from a run stream tool_output item (SDK-agnostic).
 * @param {object} item - Stream event item (tool_output)
 * @returns {string|null}
 */
export function getToolOutputTextFromItem(item) {
  if (typeof item?.output === 'string') return item.output;
  if (item?.rawItem?.content && Array.isArray(item.rawItem.content)) {
    const textPart = item.rawItem.content.find(
      (c) => c.type === 'output_text' || c.type === 'text' || c.type === 'input_text'
    );
    if (textPart?.text) return textPart.text;
  }
  return null;
}

/**
 * If the stream tool_output is from a YouTube video-returning tool, parse and return videos.
 * @param {object} item - Stream event item (tool_output)
 * @param {string} toolName - Resolved tool name
 * @returns {Array|null} Normalized videos array or null
 */
export function getVideosFromStreamToolOutput(item, toolName) {
  if (!YOUTUBE_VIDEO_TOOLS.includes(toolName)) return null;
  const outputText = getToolOutputTextFromItem(item);
  if (!outputText) return null;
  return extractVideosFromToolResult(outputText);
}
