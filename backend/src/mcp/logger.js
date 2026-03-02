/**
 * MCP server logger. Writes to stderr only (stdout is reserved for JSON-RPC).
 * Uses blue ANSI color so MCP logs are visually distinct in the terminal.
 */
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

export function createMcpLogger() {
  return (level, msg, ctx = {}) => {
    const line = `[${new Date().toISOString()}] [mcp] level=${level} msg=${msg} ${Object.entries(ctx)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(' ')}`;
    console.error(`${BLUE}${line}${RESET}`);
  };
}

export const log = createMcpLogger();
