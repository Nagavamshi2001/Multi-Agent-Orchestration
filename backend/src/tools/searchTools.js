import { search, SafeSearchType } from 'duck-duck-scrape';
import { toolSuccess, toolError, toolEmpty } from '../utils/toolResponse.js';
import { safeTitle, clampMaxResults } from '../utils/helpers.js';

export const webSearch = async ({ query, maxResults = 10 }) => {
  if (!query || !query.trim()) {
    return toolError('Search query is required.');
  }

  try {
    const q = query.trim();
    const result = await search(q, {
      safeSearch: SafeSearchType.MODERATE,
    });

    if (result.noResults || !result.results || result.results.length === 0) {
      return toolEmpty(`No results found for "${q}".`, { results: [], query: q });
    }

    const cap = clampMaxResults(maxResults, 20);
    const items = result.results.slice(0, cap).map((r) => ({
      title: safeTitle(r.title),
      url: r.url || null,
      description: r.description || null,
    }));

    return toolSuccess({
      count: items.length,
      query: q,
      results: items,
    });
  } catch (err) {
    console.error('[webSearch] Error:', err.message);
    return toolError(`Search failed: ${err.message}`);
  }
};
