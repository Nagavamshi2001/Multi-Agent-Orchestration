/**
 * Central configuration from environment. Single place to read PORT, URLs, and feature flags.
 * Use this instead of process.env throughout the app for testability and reuse.
 */
const truthy = (v) => ['1', 'true', 'yes', 'on'].includes(String(v ?? '').toLowerCase());

export const config = Object.freeze({
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  developerMode: truthy(process.env.DEVELOPER_MODE),
  logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  mongodbUri: process.env.MONGODB_URI || '',
});

export default config;
