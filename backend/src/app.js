/**
 * Express app factory. Creates the app with middleware and routes; does not start the server.
 * Reusable for tests and programmatic use.
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { attachUser } from './auth/session.js';
import { mountRoutes } from './routes/index.js';
import { logger } from './utils/logger.js';
import { config } from './config/index.js';

export function createApp(options = {}) {
  const { developerMode = config.developerMode } = options;
  const app = express();

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (origin === config.frontendUrl) return cb(null, true);
        return cb(new Error('CORS blocked'), false);
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachUser);

  mountRoutes(app, { developerMode });

  app.use((err, req, res, next) => {
    logger.error('http.unhandled', {
      path: req.path,
      method: req.method,
      userId: req.user?.id ?? null,
      message: err.message,
      stack: config.nodeEnv === 'production' ? undefined : err.stack,
    });
    const status = err.status ?? 500;
    const safeMessage =
      status >= 500 ? 'Internal server error. Please try again later.' : err.message ?? 'Request failed';
    res.status(status).json({ error: safeMessage });
  });

  return app;
}
