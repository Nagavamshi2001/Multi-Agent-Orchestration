import { search, SafeSearchType } from 'duck-duck-scrape';

// ─── Web Search Tools (no API key required) ───────────────────────────────────
// Uses DuckDuckGo via duck-duck-scrape for basic web search

// ─── Tool: Web Search ─────────────────────────────────────────────────────────
export const webSearch = async ({ query, maxResults = 10 }) => {
  if (!query || !query.trim()) {
    return JSON.stringify({ error: 'Search query is required.' });
  }

  try {
    const result = await search(query.trim(), {
      safeSearch: SafeSearchType.MODERATE,
    });

    if (result.noResults || !result.results || result.results.length === 0) {
      return JSON.stringify({
        count: 0,
        results: [],
        query: query.trim(),
        message: `No results found for "${query.trim()}".`,
      });
    }

    const items = result.results.slice(0, Math.min(maxResults, 20)).map((r) => ({
      title: r.title || '(No title)',
      url: r.url || null,
      description: r.description || null,
    }));

    return JSON.stringify({
      count: items.length,
      query: query.trim(),
      results: items,
    });
  } catch (err) {
    console.error('[webSearch] Error:', err.message);
    return JSON.stringify({ error: `Search failed: ${err.message}` });
  }
};
