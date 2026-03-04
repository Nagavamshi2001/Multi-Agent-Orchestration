/**
 * Reusable Docs/Sheets helpers: tool names, agent names, parsing tool results for WebSocket/DB attachment.
 * Mirrors youtubeHelpers.js. Used by chatWsServer.js.
 */
import { getToolOutputTextFromItem } from './youtubeHelpers.js';

/** Tool names that return a `documents` array (create_document returns single doc wrapped in array for UI). */
export const DOCS_TOOLS = ['search_documents', 'create_document'];

/** Tool names that return a `spreadsheets` array (create_spreadsheet returns single sheet wrapped in array). */
export const SHEETS_TOOLS = ['search_spreadsheets', 'create_spreadsheet'];

/** Docs Assistant agent name (for attaching docs to response). */
export const DOCS_AGENT_NAME = 'Docs Assistant';

/** Sheets Assistant agent name (for attaching sheets to response). */
export const SHEETS_AGENT_NAME = 'Sheets Assistant';

/**
 * Parse tool result JSON and extract documents array. For create_document, wrap single doc in array.
 * @param {string|object} resultJson - Tool return value (stringified JSON or object)
 * @returns {Array|null} Array of { id, name, documentUrl?, webViewLink?, modifiedTime? } or null
 */
export function extractDocsFromToolResult(resultJson) {
  try {
    const data = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
    if (!data) return null;
    if (Array.isArray(data.documents) && data.documents.length > 0) return data.documents;
    if (data.documentId || data.documentUrl) {
      return [{
        id: data.documentId,
        name: data.title || '(Untitled)',
        documentUrl: data.documentUrl || (data.documentId ? `https://docs.google.com/document/d/${data.documentId}/edit` : null),
        webViewLink: data.documentUrl || (data.documentId ? `https://docs.google.com/document/d/${data.documentId}/edit` : null),
        modifiedTime: data.modifiedTime || null,
      }];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse tool result JSON and extract spreadsheets array. For create_spreadsheet, wrap single sheet in array.
 * @param {string|object} resultJson - Tool return value (stringified JSON or object)
 * @returns {Array|null} Array of { id, name, spreadsheetUrl?, webViewLink?, modifiedTime? } or null
 */
export function extractSheetsFromToolResult(resultJson) {
  try {
    const data = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
    if (!data) return null;
    if (Array.isArray(data.spreadsheets) && data.spreadsheets.length > 0) return data.spreadsheets;
    if (data.spreadsheetId || data.spreadsheetUrl) {
      return [{
        id: data.spreadsheetId,
        name: data.title || '(Untitled)',
        spreadsheetUrl: data.spreadsheetUrl || (data.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit` : null),
        webViewLink: data.spreadsheetUrl || (data.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit` : null),
        modifiedTime: data.modifiedTime || null,
      }];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * If the stream tool_output is from a Docs tool that returns documents, parse and return them.
 * @param {object} item - Stream event item (tool_output)
 * @param {string} toolName - Resolved tool name
 * @returns {Array|null}
 */
export function getDocsFromStreamToolOutput(item, toolName) {
  if (!DOCS_TOOLS.includes(toolName)) return null;
  const outputText = getToolOutputTextFromItem(item);
  if (!outputText) return null;
  return extractDocsFromToolResult(outputText);
}

/**
 * If the stream tool_output is from a Sheets tool that returns spreadsheets, parse and return them.
 * @param {object} item - Stream event item (tool_output)
 * @param {string} toolName - Resolved tool name
 * @returns {Array|null}
 */
export function getSheetsFromStreamToolOutput(item, toolName) {
  if (!SHEETS_TOOLS.includes(toolName)) return null;
  const outputText = getToolOutputTextFromItem(item);
  if (!outputText) return null;
  return extractSheetsFromToolResult(outputText);
}
