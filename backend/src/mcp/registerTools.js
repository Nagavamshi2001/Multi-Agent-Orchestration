/**
 * Registers all MCP tools from the shared registry onto an McpServer instance.
 * Single source of truth: registry → MCP tool definitions; handlers run in request context.
 */
import { z } from 'zod';
import { runWithContext } from '../auth/requestContext.js';
import { getAllMcpToolDefs } from '../tools/registry.js';

const contextSchema = z.record(z.unknown()).optional();

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} mcpServer
 * @param {(level: string, msg: string, ctx?: object) => void} log
 */
export function registerAllTools(mcpServer, log) {
  const inputSchemaWithContext = (schema) =>
    schema.and(z.object({ __mcpContext: contextSchema }));

  for (const def of getAllMcpToolDefs()) {
    const inputSchema = inputSchemaWithContext(def.parameters);
    mcpServer.registerTool(def.name, { description: def.description, inputSchema }, async (args, _extra) => {
      log('info', 'mcp.server.tool_call', { tool: def.name });
      const { __mcpContext, ...toolInput } = args || {};
      const ctx = __mcpContext && typeof __mcpContext === 'object' ? __mcpContext : {};
      log('info', 'mcp.server.tool_context', {
        tool: def.name,
        hasContext: !!ctx.googleRefreshToken,
        userId: ctx.userId,
      });
      try {
        const result = await runWithContext(ctx, () => def.execute(toolInput));
        const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        log('error', 'mcp.server.tool_error', { tool: def.name, message: err.message });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                message: err.message || 'Tool execution failed.',
              }),
            },
          ],
        };
      }
    });
  }
}
