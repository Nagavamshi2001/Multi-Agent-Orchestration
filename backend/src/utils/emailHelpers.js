/**
 * Gmail message parsing helpers.
 */

/**
 * Decode base64url email body.
 * @param {string} str
 * @returns {string}
 */
export const decodeBody = (str) => {
  if (!str) return '';
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
};

/**
 * Extract header value from Gmail message headers.
 * @param {Array} headers
 * @param {string} name
 * @returns {string}
 */
export const getHeader = (headers, name) => {
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
};

/**
 * Extract email body from Gmail message payload.
 * @param {object} payload
 * @returns {string}
 */
export const extractBody = (payload) => {
  if (!payload) return '';
  if (payload.body?.data) return decodeBody(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBody(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBody(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }
  return '';
};
