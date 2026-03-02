import news from 'gnews';
import { toolSuccess, toolError, toolEmpty } from '../utils/toolResponse.js';
import { clampMaxResults, formatNewsArticle } from '../utils/helpers.js';

const TOPICS = ['WORLD', 'BUSINESS', 'TECHNOLOGY', 'SCIENCE', 'ENTERTAINMENT', 'SPORTS', 'HEALTH'];

export const getHeadlines = async ({ maxResults = 10, country = 'us', language = 'en' }) => {
  const c = country ?? 'us';
  const lang = language ?? 'en';
  try {
    const articles = await news.headlines({
      country: typeof c === 'string' ? c.toLowerCase() : 'us',
      language: typeof lang === 'string' ? lang.toLowerCase() : 'en',
      n: clampMaxResults(maxResults, 20),
    });

    if (!articles || articles.length === 0) {
      return toolEmpty('No headlines found.', { articles: [] });
    }

    const formatted = articles.map(formatNewsArticle);
    return toolSuccess({ count: formatted.length, articles: formatted });
  } catch (err) {
    console.error('[getHeadlines] Error:', err.message);
    return toolError(`Failed to fetch headlines: ${err.message}`);
  }
};

export const searchNews = async ({ query, maxResults = 10, country = 'us', language = 'en' }) => {
  if (!query || !query.trim()) {
    return toolError('Search query is required.');
  }
  const c = country ?? 'us';
  const lang = language ?? 'en';
  try {
    const q = query.trim();
    const articles = await news.search(q, {
      country: typeof c === 'string' ? c.toLowerCase() : 'us',
      language: typeof lang === 'string' ? lang.toLowerCase() : 'en',
      n: clampMaxResults(maxResults, 20),
    });

    if (!articles || articles.length === 0) {
      return toolEmpty(`No articles found for "${q}".`, { articles: [], query: q });
    }

    const formatted = articles.map(formatNewsArticle);
    return toolSuccess({ count: formatted.length, query: q, articles: formatted });
  } catch (err) {
    console.error('[searchNews] Error:', err.message);
    return toolError(`Failed to search news: ${err.message}`);
  }
};

// ─── Tool: Get News by Topic ───────────────────────────────────────────────────
export const getNewsByTopic = async ({
  topic,
  maxResults = 10,
  country = 'us',
  language = 'en',
}) => {
  const normalized = (topic || 'WORLD').toUpperCase();
  if (!TOPICS.includes(normalized)) {
    return JSON.stringify({
      error: `Invalid topic. Use one of: ${TOPICS.join(', ')}`,
    });
  }
  const c = country ?? 'us';
  const lang = language ?? 'en';
  try {
    const articles = await news.topic(normalized, {
      country: typeof c === 'string' ? c.toLowerCase() : 'us',
      language: typeof lang === 'string' ? lang.toLowerCase() : 'en',
      n: Math.min(maxResults, 20),
    });

    if (!articles || articles.length === 0) {
      return JSON.stringify({ count: 0, articles: [], topic: normalized, message: 'No articles found.' });
    }

    const formatted = articles.map((a) => ({
      title: a.title || '(No title)',
      link: a.link || null,
      pubDate: a.pubDate || null,
      source: a.source?.title || a.source || null,
    }));

    return JSON.stringify({ count: formatted.length, topic: normalized, articles: formatted });
  } catch (err) {
    console.error('[getNewsByTopic] Error:', err.message);
    return JSON.stringify({ error: `Failed to fetch news: ${err.message}` });
  }
};

export const getNewsByLocation = async ({
  location,
  maxResults = 10,
  country = 'us',
  language = 'en',
}) => {
  if (!location || !location.trim()) {
    return toolError('Location is required (e.g., "New York", "London").');
  }
  const c = country ?? 'us';
  const lang = language ?? 'en';
  try {
    const loc = location.trim();
    const articles = await news.geo(loc, {
      country: typeof c === 'string' ? c.toLowerCase() : 'us',
      language: typeof lang === 'string' ? lang.toLowerCase() : 'en',
      n: clampMaxResults(maxResults, 20),
    });

    if (!articles || articles.length === 0) {
      return toolEmpty(`No articles found for "${loc}".`, { articles: [], location: loc });
    }

    const formatted = articles.map(formatNewsArticle);
    return toolSuccess({
      count: formatted.length,
      location: loc,
      articles: formatted,
    });
  } catch (err) {
    console.error('[getNewsByLocation] Error:', err.message);
    return toolError(`Failed to fetch news: ${err.message}`);
  }
};
