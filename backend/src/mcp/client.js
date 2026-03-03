/**
 * MCP client used by agents to call tools via the MCP server.
 * Flow: Agent → this client → MCP Server (stdio) → Tool implementation.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..', '..');
const serverScript = path.join(backendRoot, 'src', 'mcp', 'server.js');

let clientPromise = null;

/**
 * Get or create the shared MCP client (connects to MCP server over stdio).
 * @returns {Promise<import('@modelcontextprotocol/sdk/client/index.js').Client>}
 */
export async function getMcpClient() {
  if (clientPromise) {
    return clientPromise;
  }
  clientPromise = (async () => {
    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverScript],
      cwd: backendRoot,
      stderr: 'inherit',
      env: { ...process.env },
    });
    const client = new Client(
      {
        name: 'google-workspace-orchestrator-client',
        version: '1.0.0',
      },
      { capabilities: {} }
    );
    await client.connect(transport);
    logger.info('mcp.client.connected', { serverScript });
    return client;
  })();
  return clientPromise;
}

/** Default MCP tool call timeout (ms). SDK default is 60s; slow tools (e.g. send_email with OAuth + Gmail) need more. */
const MCP_TOOL_TIMEOUT_MS = Number(process.env.MCP_TOOL_TIMEOUT_MS) || 120_000;

/**
 * Call a tool by name on the MCP server. Used by agent tool execute handlers.
 * @param {string} name - Tool name (e.g. 'send_email', 'list_upcoming_events')
 * @param {Record<string, unknown>} args - Tool arguments
 * @returns {Promise<string>} Tool result as text (from MCP content[].text)
 */
export async function callMcpTool(name, args) {
  try {
    const client = await getMcpClient();
    const result = await client.callTool(
      {
        name,
        arguments: args ?? {},
      },
      undefined,
      { timeout: MCP_TOOL_TIMEOUT_MS }
    );
    const content = result?.content;
    if (Array.isArray(content) && content.length > 0) {
      const textPart = content.find((c) => c.type === 'text');
      if (textPart && typeof textPart.text === 'string') {
        return textPart.text;
      }
    }
    return JSON.stringify(result ?? {});
  } catch (err) {
    logger.error('mcp.client.tool_error', {
      tool: name,
      message: err.message,
      stack: err.stack,
    });
    return JSON.stringify({
      error: true,
      message: err.message || 'MCP tool call failed. Please try again.',
    });
  }
}
