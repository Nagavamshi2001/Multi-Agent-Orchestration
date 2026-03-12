/**
 * Formatting helpers for display (time, markdown-like text).
 */

/**
 * Format a timestamp for message display (e.g. "2:30 PM").
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function formatMessageTime(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Simple markdown-like formatting to HTML for message content.
 * Order matters (e.g. bold before headers).
 * @param {string} text - Raw message text
 * @returns {string} HTML string safe for v-html
 */
export function formatMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  let out = text;
  out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
  out = out.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  out = out.replace(/^### (.*$)/gm, '<h3 class="md-h3">$1</h3>');
  out = out.replace(/^## (.*$)/gm, '<h2 class="md-h2">$1</h2>');
  out = out.replace(/^\d+\. (.*$)/gm, '<li class="md-li ordered">$1</li>');
  out = out.replace(/^[-*•] (.*$)/gm, '<li class="md-li">$1</li>');
  out = out.replace(/\n/g, '<br>');
  return out;
}
