/**
 * Central route mounting. Mounts all API routers onto the Express app.
 * @param {import('express').Express} app
 * @param {{ developerMode: boolean }} options
 */
import { googleAuthRouter } from '../auth/googleRoutes.js';
import { healthRouter } from './healthRoutes.js';
import { chatRouter } from './chatRoutes.js';
import { metricsRouter } from './metricsRoutes.js';
import { mcpRouter } from './mcpRoutes.js';
import { settingsRouter } from './settingsRoutes.js';

export function mountRoutes(app, options = {}) {
  const { developerMode = false } = options;
  app.use('/api/auth', googleAuthRouter());
  app.use('/api', healthRouter());
  app.use('/api', chatRouter({ developerMode }));
  app.use('/api', metricsRouter());
  app.use('/api', mcpRouter());
  app.use('/api', settingsRouter());
}
