import { getYouTubeClient, isYouTubeConfigured } from '../utils/googleAuth.js';
import { toolSuccess, toolError, toolEmpty } from '../utils/toolResponse.js';
import { safeTitle, clampMaxResults } from '../utils/helpers.js';
import { toNormalizedVideo } from '../utils/youtubeHelpers.js';

export { isYouTubeConfigured };
export { extractVideosFromToolResult } from '../utils/youtubeHelpers.js';

// ─── Tool: Get my channel ─────────────────────────────────────────────────────
export const getMyChannel = async () => {
  if (!isYouTubeConfigured()) {
    return toolError(
      'YouTube credentials not configured. Add YouTube scope to OAuth (https://www.googleapis.com/auth/youtube.readonly)',
      { setup: 'Re-authorize with YouTube scope and sign in again.' }
    );
  }

  try {
    const youtube = getYouTubeClient();
    const res = await youtube.channels.list({
      part: 'snippet,statistics',
      mine: true,
    });
    const items = res.data.items || [];

    if (items.length === 0) {
      return toolEmpty('No YouTube channel found for this account.', { channel: null });
    }

    const ch = items[0];
    const snippet = ch.snippet || {};
    const stats = ch.statistics || {};
    const channel = {
      id: ch.id,
      title: safeTitle(snippet.title),
      description: (snippet.description || '').substring(0, 300),
      thumbnailUrl: snippet.thumbnails?.default?.url || null,
      subscriberCount: stats.subscriberCount || '0',
      videoCount: stats.videoCount || '0',
    };

    return toolSuccess({ channel });
  } catch (err) {
    console.error('[getMyChannel] Error:', err.message);
    return toolError(`Failed to get channel: ${err.message}`);
  }
};

// ─── Tool: List my playlists ─────────────────────────────────────────────────
export const listMyPlaylists = async ({ maxResults = 20 } = {}) => {
  if (!isYouTubeConfigured()) {
    return toolError('YouTube credentials not configured.');
  }

  try {
    const youtube = getYouTubeClient();
    const res = await youtube.playlists.list({
      part: 'snippet',
      mine: true,
      maxResults: clampMaxResults(maxResults, 50),
    });
    const items = res.data.items || [];

    if (items.length === 0) {
      return toolEmpty('No playlists found.', { playlists: [] });
    }

    const playlists = items.map((p) => {
      const sn = p.snippet || {};
      return {
        id: p.id,
        title: safeTitle(sn.title),
        description: (sn.description || '').substring(0, 200),
        thumbnailUrl: sn.thumbnails?.default?.url || null,
      };
    });

    return toolSuccess({ count: playlists.length, playlists });
  } catch (err) {
    console.error('[listMyPlaylists] Error:', err.message);
    return toolError(`Failed to list playlists: ${err.message}`);
  }
};

// ─── Tool: List playlist items ───────────────────────────────────────────────
export const listPlaylistItems = async ({ playlistId, maxResults = 20 } = {}) => {
  if (!isYouTubeConfigured()) {
    return toolError('YouTube credentials not configured.');
  }
  if (!playlistId || !playlistId.trim()) {
    return toolError('playlistId is required.');
  }

  try {
    const youtube = getYouTubeClient();
    const res = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId: playlistId.trim(),
      maxResults: clampMaxResults(maxResults, 50),
    });
    const items = res.data.items || [];

    if (items.length === 0) {
      return toolEmpty('No videos in this playlist.', { videos: [] });
    }

    const videos = items.map((item) => toNormalizedVideo(item));
    return toolSuccess({ count: videos.length, videos });
  } catch (err) {
    console.error('[listPlaylistItems] Error:', err.message);
    return toolError(`Failed to list playlist items: ${err.message}`);
  }
};

// ─── Tool: Search videos ──────────────────────────────────────────────────────
export const searchVideos = async ({ query, maxResults = 10 } = {}) => {
  if (!isYouTubeConfigured()) {
    return toolError('YouTube credentials not configured.');
  }
  if (!query || !String(query).trim()) {
    return toolError('query is required for search.');
  }

  try {
    const youtube = getYouTubeClient();
    const res = await youtube.search.list({
      part: 'snippet',
      type: 'video',
      q: String(query).trim(),
      maxResults: clampMaxResults(maxResults, 25),
    });
    const items = res.data.items || [];

    if (items.length === 0) {
      return toolEmpty(`No videos found for "${query}".`, { videos: [] });
    }

    const videos = items.map((item) => toNormalizedVideo(item));
    return toolSuccess({ count: videos.length, videos });
  } catch (err) {
    console.error('[searchVideos] Error:', err.message);
    return toolError(`Failed to search videos: ${err.message}`);
  }
};

// ─── Tool: Search music (YouTube Music style) ─────────────────────────────────
export const searchMusic = async ({ query, maxResults = 10 } = {}) => {
  if (!isYouTubeConfigured()) {
    return toolError('YouTube credentials not configured.');
  }
  if (!query || !String(query).trim()) {
    return toolError('query is required for music search.');
  }

  try {
    const youtube = getYouTubeClient();
    const q = String(query).trim();
    const max = clampMaxResults(maxResults, 25);

    let res = await youtube.search.list({
      part: 'snippet',
      type: 'video',
      q,
      videoCategoryId: '10', // Music
      maxResults: max,
    });
    let items = res.data.items || [];

    if (items.length === 0) {
      res = await youtube.search.list({
        part: 'snippet',
        type: 'video',
        q: q + ' music',
        maxResults: max,
      });
      items = res.data.items || [];
    }

    if (items.length === 0) {
      return toolEmpty(`No music found for "${query}".`, { videos: [] });
    }

    const videos = items.map((item) => toNormalizedVideo(item));
    return toolSuccess({ count: videos.length, videos });
  } catch (err) {
    console.error('[searchMusic] Error:', err.message);
    return toolError(`Failed to search music: ${err.message}`);
  }
};

// ─── Tool: Get video details ─────────────────────────────────────────────────
export const getVideoDetails = async ({ videoId } = {}) => {
  if (!isYouTubeConfigured()) {
    return toolError('YouTube credentials not configured.');
  }
  if (!videoId || !String(videoId).trim()) {
    return toolError('videoId is required.');
  }

  try {
    const youtube = getYouTubeClient();
    const res = await youtube.videos.list({
      part: 'snippet,contentDetails,statistics',
      id: String(videoId).trim(),
    });
    const items = res.data.items || [];

    if (items.length === 0) {
      return toolEmpty('Video not found.', { video: null });
    }

    const item = items[0];
    const video = toNormalizedVideo(item);
    video.duration = item.contentDetails?.duration || null;
    video.viewCount = item.statistics?.viewCount || null;
    video.likeCount = item.statistics?.likeCount || null;
    video.description = (item.snippet?.description || '').substring(0, 500);

    return toolSuccess({ video });
  } catch (err) {
    console.error('[getVideoDetails] Error:', err.message);
    return toolError(`Failed to get video details: ${err.message}`);
  }
};
