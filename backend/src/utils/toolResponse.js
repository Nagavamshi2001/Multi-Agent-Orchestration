/**
 * Standardised tool response helpers.
 * All tools return JSON strings via the agents SDK.
 */

/**
 * Return a success response as JSON string.
 * @param {object} data - Response payload
 * @returns {string}
 */
export const toolSuccess = (data) => JSON.stringify(data);

/**
 * Return an error response as JSON string.
 * @param {string} message - Error message
 * @param {object} [extra] - Additional fields (e.g. setup)
 * @returns {string}
 */
export const toolError = (message, extra = {}) =>
  JSON.stringify({ error: message, ...extra });

/**
 * Return an empty-results response as JSON string.
 * @param {string} message - User-friendly message
 * @param {object} [extra] - Additional fields (e.g. count, query, events)
 * @returns {string}
 */
export const toolEmpty = (message, extra = {}) =>
  JSON.stringify({ count: 0, ...extra, message });

/**
 * Wrap a tool function with consistent try/catch error handling.
 * @param {string} toolName - Name for logging (e.g. 'listUpcomingEvents')
 * @param {string} errorPrefix - Prefix for error message (e.g. 'Failed to list events')
 * @param {(...args) => Promise<string>} fn - Async tool function
 * @returns {(...args) => Promise<string>}
 */
export const withToolErrorHandling = (toolName, errorPrefix, fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error(`[${toolName}] Error:`, err.message);
      return toolError(`${errorPrefix}: ${err.message}`);
    }
  };
};
