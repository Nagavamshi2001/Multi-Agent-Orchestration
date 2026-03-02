import { run, Runner, OpenAIProvider } from '@openai/agents';
import { getSettings, getSettingsWithKey } from '../db/db.js';

const ENV_KEY = process.env.OPENAI_API_KEY;
const ENV_KEY_PLACEHOLDER = 'sk-your-openai-api-key-here';
const DEFAULT_MODEL = 'gpt-4o';

/**
 * Resolve effective OpenAI API key and model for a user.
 * - When developerMode is true: use env OPENAI_API_KEY; use user's model preference if set, else default.
 * - When developerMode is false: use only user's key and model from settings (no env fallback).
 */
export const resolveOpenAIConfig = (userId, developerMode = false) => {
  let apiKey = null;
  let model = DEFAULT_MODEL;

  if (developerMode) {
    apiKey = ENV_KEY && ENV_KEY !== ENV_KEY_PLACEHOLDER ? ENV_KEY : null;
    if (userId) {
      const settings = getSettings(userId);
      if (settings?.model) model = settings.model;
    }
    return { apiKey, model };
  }

  if (userId) {
    const withKey = getSettingsWithKey(userId);
    if (withKey?.openaiApiKey) {
      apiKey = withKey.openaiApiKey;
      model = withKey.model || DEFAULT_MODEL;
      return { apiKey, model };
    }
  }

  return { apiKey, model };
};

/**
 * Run the orchestrator agent with the correct API key and model for the user.
 * Uses a Runner with resolved key and model so per-user settings are applied.
 */
export const runAgent = (orchestratorAgent, agentInput, options = {}) => {
  const { stream = false, userId = null, developerMode = false } = options;
  const config = resolveOpenAIConfig(userId, developerMode);

  if (!config.apiKey) {
    return Promise.reject(new Error('OpenAI API key not configured. Set it in Settings or in server .env.'));
  }

  const provider = new OpenAIProvider({ apiKey: config.apiKey });
  const runner = new Runner({
    modelProvider: provider,
    model: config.model,
    tracingDisabled: true, // use user key per request; SDK tracing only reads env, so disable to avoid "No API key provided for OpenAI tracing exporter"
  });
  return runner.run(orchestratorAgent, agentInput, { stream });
};
