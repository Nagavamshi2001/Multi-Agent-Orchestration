import news from 'gnews';

// ─── Google News Tools (no API key required) ───────────────────────────────────
// Uses gnews package to fetch from Google News RSS

const TOPICS = ['WORLD', 'BUSINESS', 'TECHNOLOGY', 'SCIENCE', 'ENTERTAINMENT', 'SPORTS', 'HEALTH'];

// ─── Tool: Get Top Headlines ───────────────────────────────────────────────────
export const getHeadlines = async ({ maxResults = 10, country = 'us', language = 'en' }) => {
  try {
    const articles = await news.headlines({
      country: country.toLowerCase(),
      language: language.toLowerCase(),
      n: Math.min(maxResults, 20),
    });

    if (!articles || articles.length === 0) {
      return JSON.stringify({ count: 0, articles: [], message: 'No headlines found.' });
    }

    const formatted = articles.map((a) => ({
      title: a.title || '(No title)',
      link: a.link || null,
      pubDate: a.pubDate || null,
      source: a.source?.title || a.source || null,
    }));

    return JSON.stringify({ count: formatted.length, articles: formatted });
  } catch (err) {
    console.error('[getHeadlines] Error:', err.message);
    return JSON.stringify({ error: `Failed to fetch headlines: ${err.message}` });
  }
};

// ─── Tool: Search News ────────────────────────────────────────────────────────
export const searchNews = async ({ query, maxResults = 10, country = 'us', language = 'en' }) => {
  if (!query || !query.trim()) {
    return JSON.stringify({ error: 'Search query is required.' });
  }

  try {
    const articles = await news.search(query.trim(), {
      country: country.toLowerCase(),
      language: language.toLowerCase(),
      n: Math.min(maxResults, 20),
    });

    if (!articles || articles.length === 0) {
      return JSON.stringify({
        count: 0,
        articles: [],
        query: query.trim(),
        message: `No articles found for "${query.trim()}".`,
      });
    }

    const formatted = articles.map((a) => ({
      title: a.title || '(No title)',
      link: a.link || null,
      pubDate: a.pubDate || null,
      source: a.source?.title || a.source || null,
    }));

    return JSON.stringify({ count: formatted.length, query: query.trim(), articles: formatted });
  } catch (err) {
    console.error('[searchNews] Error:', err.message);
    return JSON.stringify({ error: `Failed to search news: ${err.message}` });
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

  try {
    const articles = await news.topic(normalized, {
      country: country.toLowerCase(),
      language: language.toLowerCase(),
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

// ─── Tool: Get News by Location ────────────────────────────────────────────────
export const getNewsByLocation = async ({
  location,
  maxResults = 10,
  country = 'us',
  language = 'en',
}) => {
  if (!location || !location.trim()) {
    return JSON.stringify({ error: 'Location is required (e.g., "New York", "London").' });
  }

  try {
    const articles = await news.geo(location.trim(), {
      country: country.toLowerCase(),
      language: language.toLowerCase(),
      n: Math.min(maxResults, 20),
    });

    if (!articles || articles.length === 0) {
      return JSON.stringify({
        count: 0,
        articles: [],
        location: location.trim(),
        message: `No articles found for "${location.trim()}".`,
      });
    }

    const formatted = articles.map((a) => ({
      title: a.title || '(No title)',
      link: a.link || null,
      pubDate: a.pubDate || null,
      source: a.source?.title || a.source || null,
    }));

    return JSON.stringify({
      count: formatted.length,
      location: location.trim(),
      articles: formatted,
    });
  } catch (err) {
    console.error('[getNewsByLocation] Error:', err.message);
    return JSON.stringify({ error: `Failed to fetch news: ${err.message}` });
  }
};
