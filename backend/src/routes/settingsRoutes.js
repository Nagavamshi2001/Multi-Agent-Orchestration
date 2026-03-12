import express from 'express';
import { getSettings, upsertSettings } from '../db/db.js';
import { logger } from '../utils/logger.js';

const requireUser = (req, res) => {
  if (req.user?.id) return true;
  res.status(401).json({ error: 'Authentication required' });
  return false;
};

const MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
];

export const settingsRouter = () => {
  const router = express.Router();

  router.get('/settings', async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      const settings = await getSettings(req.user.id);
      const payload = {
        hasOpenaiKey: settings?.hasOpenaiKey ?? false,
        model: settings?.model ?? 'gpt-4o',
        models: MODELS,
        allowAgentReadDocsSheets: settings?.allowAgentReadDocsSheets ?? false,
      };
      return res.json(payload);
    } catch (err) {
      logger.error('settings.get.error', { userId: req.user?.id, error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  router.put('/settings', async (req, res) => {
    if (!requireUser(req, res)) return;
    const { openaiApiKey, model, allowAgentReadDocsSheets } = req.body || {};
    try {
      const modelVal =
        typeof model === 'string' && model.trim() && MODELS.includes(model.trim())
          ? model.trim()
          : undefined;
      const keyVal =
        openaiApiKey === undefined
          ? undefined
          : typeof openaiApiKey === 'string'
            ? openaiApiKey.trim() || null
            : null;
      const allowReadVal = typeof allowAgentReadDocsSheets === 'boolean' ? allowAgentReadDocsSheets : undefined;
      await upsertSettings(req.user.id, { openaiApiKey: keyVal, model: modelVal, allowAgentReadDocsSheets: allowReadVal });
      const updated = await getSettings(req.user.id);
      return res.json({
        hasOpenaiKey: updated?.hasOpenaiKey ?? false,
        model: updated?.model ?? 'gpt-4o',
        allowAgentReadDocsSheets: updated?.allowAgentReadDocsSheets ?? false,
      });
    } catch (err) {
      logger.error('settings.put.error', { userId: req.user?.id, error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
};
