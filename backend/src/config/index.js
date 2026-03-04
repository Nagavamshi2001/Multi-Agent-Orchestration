/**
 * Central configuration from environment. Single place to read PORT, URLs, and feature flags.
 * Use this instead of process.env throughout the app for testability and reuse.
 */
const truthy = (v) => ['1', 'true', 'yes', 'on'].includes(String(v ?? '').toLowerCase());

const numEnv = (key, fallback) => {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Max document body characters to send to the agent (token cost). Override with AGENT_MAX_DOC_CHARS. */
export const AGENT_MAX_DOC_CHARS = numEnv('AGENT_MAX_DOC_CHARS', 12_000);

/** Max spreadsheet cells (rows × cols) to send to the agent. Override with AGENT_MAX_SHEET_CELLS. */
export const AGENT_MAX_SHEET_CELLS = numEnv('AGENT_MAX_SHEET_CELLS', 500);

export const config = Object.freeze({
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  developerMode: truthy(process.env.DEVELOPER_MODE),
  logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  mongodbUri: process.env.MONGODB_URI || '',
  agentMaxDocChars: AGENT_MAX_DOC_CHARS,
  agentMaxSheetCells: AGENT_MAX_SHEET_CELLS,
});

export default config;
