/**
 * MCP tool bridge: agents get tools through this layer; execute() calls the MCP server.
 * Flow: Orchestrator → (handoff) → Email Agent → MCP Client → MCP Server → Tool.
 * Request context (user OAuth) is passed to the MCP server so tools run as the correct user.
 * Pass requestContext when creating agents so the SDK's tool execute gets the right user (ALS can be lost across async).
 */
import { tool } from '@openai/agents';
import { getContext } from '../auth/requestContext.js';
import { callMcpTool } from './client.js';
import { logger } from '../utils/logger.js';
import {
  emailToolDefs,
  calendarToolDefs,
  tasksToolDefs,
  newsToolDefs,
  searchToolDefs,
  youtubeToolDefs,
  docsToolDefs,
  sheetsToolDefs,
} from '../tools/registry.js';

/**
 * @param {Record<string, unknown>} [requestContext] - If provided, used as __mcpContext for MCP; else getContext().
 */
function toAgentTools(defs, requestContext) {
  return defs.map((def) =>
    tool({
      name: def.name,
      description: def.description,
      parameters: def.parameters,
      execute: async (params) => {
        logger.info('mcp.bridge.tool_execute', { tool: def.name });
        const ctx = requestContext !== undefined ? requestContext : getContext();
        return callMcpTool(def.name, { ...(params ?? {}), __mcpContext: ctx });
      },
    })
  );
}

export function getEmailTools(requestContext) {
  return toAgentTools(emailToolDefs, requestContext);
}

export function getCalendarTools(requestContext) {
  return toAgentTools(calendarToolDefs, requestContext);
}

export function getTasksTools(requestContext) {
  return toAgentTools(tasksToolDefs, requestContext);
}

export function getNewsTools(requestContext) {
  return toAgentTools(newsToolDefs, requestContext);
}

export function getSearchTools(requestContext) {
  return toAgentTools(searchToolDefs, requestContext);
}

export function getYouTubeTools(requestContext) {
  return toAgentTools(youtubeToolDefs, requestContext);
}

export function getDocsTools(requestContext) {
  return toAgentTools(docsToolDefs, requestContext);
}

export function getSheetsTools(requestContext) {
  return toAgentTools(sheetsToolDefs, requestContext);
}
