import { getSheetsClient, getDriveClient, isSheetsConfigured } from '../utils/googleAuth.js';
import { toolSuccess, toolError, toolEmpty } from '../utils/toolResponse.js';
import { safeTitle } from '../utils/helpers.js';
import { listDriveFilesByMimeType } from '../utils/driveUtils.js';

const SHEETS_MIME_TYPE = 'application/vnd.google-apps.spreadsheet';

export { isSheetsConfigured };

/**
 * Build spreadsheet URL from spreadsheetId.
 * @param {string} spreadsheetId
 * @returns {string}
 */
function spreadsheetUrl(spreadsheetId) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

export const create_spreadsheet = async ({ title, sheetName }) => {
  if (!isSheetsConfigured()) {
    return toolError(
      'Sheets credentials not configured. Add Sheets and Drive scopes to OAuth (spreadsheets, drive.readonly).',
      { setup: 'Re-authorize with Google so the app can create spreadsheets.' }
    );
  }
  if (!title || !String(title).trim()) {
    return toolError('title is required.');
  }
  try {
    const sheets = getSheetsClient();
    const requestBody = {
      properties: { title: safeTitle(title, 'Untitled') },
    };
    if (sheetName != null && String(sheetName).trim()) {
      requestBody.sheets = [{ properties: { title: String(sheetName).trim() } }];
    }
    const res = await sheets.spreadsheets.create({ requestBody });
    const spreadsheetId = res.data.spreadsheetId;
    if (!spreadsheetId) {
      return toolError('Sheets API did not return a spreadsheet ID.');
    }
    const docTitle = res.data.properties?.title || title;
    return toolSuccess({
      success: true,
      message: `Spreadsheet "${docTitle}" created successfully.`,
      spreadsheetId,
      title: docTitle,
      spreadsheetUrl: spreadsheetUrl(spreadsheetId),
      spreadsheets: [{ id: spreadsheetId, name: docTitle, spreadsheetUrl: spreadsheetUrl(spreadsheetId), webViewLink: spreadsheetUrl(spreadsheetId), modifiedTime: new Date().toISOString() }],
    });
  } catch (err) {
    console.error('[create_spreadsheet] Error:', err.message);
    return toolError(`Failed to create spreadsheet: ${err.message}`);
  }
};

export const search_spreadsheets = async ({ query, maxResults }) => {
  if (!isSheetsConfigured()) {
    return toolError(
      'Sheets/Drive credentials not configured. Add Sheets and Drive read scope to OAuth.',
      { setup: 'Re-authorize with Google so the app can search your spreadsheets.' }
    );
  }
  try {
    const drive = getDriveClient();
    const files = await listDriveFilesByMimeType({
      mimeType: SHEETS_MIME_TYPE,
      query: query || undefined,
      maxResults,
      driveClient: drive,
    });
    if (files.length === 0) {
      return toolEmpty('No Google Sheets found.', { spreadsheets: [] });
    }
    return toolSuccess({ count: files.length, spreadsheets: files });
  } catch (err) {
    console.error('[search_spreadsheets] Error:', err.message);
    return toolError(`Failed to search spreadsheets: ${err.message}`);
  }
};

export const get_spreadsheet_data = async ({ spreadsheetId }) => {
  if (!isSheetsConfigured()) {
    return toolError('Sheets credentials not configured. Add Sheets scope to OAuth.');
  }
  if (!spreadsheetId || !String(spreadsheetId).trim()) {
    return toolError('spreadsheetId is required.');
  }
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId.trim(),
      fields: 'properties.title',
    });
    const title = res.data.properties?.title || '(Untitled)';
    const sheetUrl = spreadsheetUrl(spreadsheetId.trim());
    const replyToUser = `Here is your spreadsheet "${title}". Open the link to view or edit it.\n\n[Open spreadsheet](${sheetUrl})`;
    return toolSuccess({
      spreadsheetId: spreadsheetId.trim(),
      title,
      spreadsheetUrl: sheetUrl,
      message: 'Spreadsheet link only; open the link to view data.',
      replyToUser,
    });
  } catch (err) {
    console.error('[get_spreadsheet_data] Error:', err.message);
    return toolError(`Failed to get spreadsheet: ${err.message}`);
  }
};

/**
 * Write or update data in a Google Sheet. Values start at the given range (e.g. Sheet1!A1).
 * Use after create_spreadsheet to add headers and rows. Each inner array is a row.
 */
export const update_spreadsheet_values = async ({ spreadsheetId, range, values }) => {
  if (!isSheetsConfigured()) {
    return toolError('Sheets credentials not configured. Add Sheets scope to OAuth.');
  }
  if (!spreadsheetId || !String(spreadsheetId).trim()) {
    return toolError('spreadsheetId is required.');
  }
  if (!range || !String(range).trim()) {
    return toolError('range is required (e.g. Sheet1!A1 for top-left cell).');
  }
  if (!Array.isArray(values) || values.length === 0) {
    return toolError('values is required: an array of rows, each row an array of cell values (strings or numbers).');
  }
  const normalizedValues = values.map((row) =>
    Array.isArray(row) ? row.map((cell) => (cell == null ? '' : String(cell))) : []
  );
  if (normalizedValues.every((row) => row.length === 0)) {
    return toolError('values must contain at least one non-empty row.');
  }
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId.trim(),
      range: range.trim(),
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: normalizedValues },
    });
    const rowCount = normalizedValues.length;
    return toolSuccess({
      success: true,
      message: `Wrote ${rowCount} row(s) to ${range.trim()}.`,
      spreadsheetId,
      range: range.trim(),
      rowsWritten: rowCount,
    });
  } catch (err) {
    console.error('[update_spreadsheet_values] Error:', err.message);
    return toolError(`Failed to write spreadsheet data: ${err.message}`);
  }
};
