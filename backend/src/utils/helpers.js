/**
 * Reusable helper utilities used across tools.
 */

const DEFAULT_TITLE_FALLBACK = '(No title)';

/**
 * Safe title/label with fallback for empty values.
 * @param {string|null|undefined} value
 * @param {string} [fallback]
 * @returns {string}
 */
export const safeTitle = (value, fallback = DEFAULT_TITLE_FALLBACK) =>
  value?.trim?.() || value || fallback;

/**
 * Clamp maxResults to a service-specific cap.
 * @param {number} maxResults
 * @param {number} cap - Max allowed (e.g. 20, 50, 100)
 * @returns {number}
 */
export const clampMaxResults = (maxResults, cap) =>
  Math.min(Math.max(Number(maxResults) || 0, 0), cap);

/**
 * Format a gnews article for consistent output.
 * @param {object} a - Raw article
 * @returns {object}
 */
export const formatNewsArticle = (a) => ({
  title: safeTitle(a.title),
  link: a.link || null,
  pubDate: a.pubDate || null,
  source: a.source?.title || a.source || null,
});
