/**
 * Load env first and disable OpenAI SDK tracing so it does not log
 * "No API key provided for OpenAI tracing exporter". We use per-user API keys
 * from Settings; the SDK's tracer only reads OPENAI_API_KEY at init.
 */
import 'dotenv/config';
process.env.OPENAI_AGENTS_DISABLE_TRACING = '1';
