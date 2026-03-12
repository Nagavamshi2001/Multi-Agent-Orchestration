/**
 * Reusable Drive API helpers. Used by docsTools and sheetsTools to list/search files by mimeType.
 */
import { clampMaxResults } from './helpers.js';

const DRIVE_LIST_CAP = 50;
const DEFAULT_MAX_RESULTS = 10;

/**
 * List Drive files by mimeType with optional name query. Normalized shape for UI.
 * @param {object} opts
 * @param {string} opts.mimeType - e.g. 'application/vnd.google-apps.document' or 'application/vnd.google-apps.spreadsheet'
 * @param {string} [opts.query] - Optional name/search query (e.g. "name contains 'foo'")
 * @param {number} [opts.maxResults] - Max files to return (default 10, cap 50)
 * @param {import('googleapis').drive_v3.Drive} opts.driveClient - Drive API client from getDriveClient()
 * @returns {Promise<Array<{ id: string, name: string, webViewLink: string|null, modifiedTime: string|null }>>}
 */
export async function listDriveFilesByMimeType({ mimeType, query, maxResults, driveClient }) {
  const limit = clampMaxResults(maxResults ?? DEFAULT_MAX_RESULTS, DRIVE_LIST_CAP) || DEFAULT_MAX_RESULTS;
  const parts = [`mimeType = '${mimeType}'`];
  if (query && String(query).trim()) {
    const escaped = String(query).trim().replace(/'/g, "\\'");
    parts.push(`name contains '${escaped}'`);
  }
  const q = parts.join(' and ');

  const res = await driveClient.files.list({
    q,
    pageSize: limit,
    fields: 'files(id,name,webViewLink,modifiedTime)',
    orderBy: 'modifiedTime desc',
  });

  const files = res.data.files || [];
  return files.map((f) => ({
    id: f.id || '',
    name: f.name || '(Untitled)',
    webViewLink: f.webViewLink || null,
    modifiedTime: f.modifiedTime || null,
  }));
}
