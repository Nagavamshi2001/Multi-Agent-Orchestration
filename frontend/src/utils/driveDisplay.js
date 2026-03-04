/**
 * Helpers for displaying Google Drive items (docs/sheets) in the UI.
 */

/**
 * Format a Drive item modifiedTime for display.
 * @param {string|null|undefined} modifiedTime - ISO date string from Drive API
 * @returns {string}
 */
export function formatDriveItemDate(modifiedTime) {
  if (!modifiedTime) return '';
  const date = new Date(modifiedTime);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

/**
 * Label for resource type (for accessibility or secondary text).
 * @param {'doc'|'sheet'} type
 * @returns {string}
 */
export function resourceTypeLabel(type) {
  if (type === 'doc') return 'Document';
  if (type === 'sheet') return 'Spreadsheet';
  return 'File';
}
