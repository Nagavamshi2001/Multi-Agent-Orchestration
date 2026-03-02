/**
 * MCP stdio server entry. Exposes tools from the shared registry over JSON-RPC (stdout/stderr).
 * Spawned by the main process via mcp/client.js when an agent calls a tool.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { log } from './logger.js';
import { registerAllTools } from './registerTools.js';

const server = new McpServer({
  name: 'google-workspace-orchestrator-tools',
  version: '1.0.0',
});

registerAllTools(server, log);

const transport = new StdioServerTransport();
log('info', 'mcp.server.starting', { name: 'google-workspace-orchestrator-tools', version: '1.0.0' });
await server.connect(transport);
log('info', 'mcp.server.started', { name: 'google-workspace-orchestrator-tools', version: '1.0.0' });
