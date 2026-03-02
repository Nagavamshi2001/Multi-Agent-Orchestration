import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.resolve(__dirname, '..', '..', 'mcp.config.json');

const readConfig = () => {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.servers || !Array.isArray(parsed.servers)) {
      return { servers: [] };
    }
    return parsed;
  } catch {
    return { servers: [] };
  }
};

const writeConfig = (config) => {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
};

export const mcpRouter = () => {
  const router = express.Router();

  // List configured MCP servers
  router.get('/mcp/servers', (req, res) => {
    const config = readConfig();
    res.json({ servers: config.servers });
  });

  // Add or update an MCP server config
  router.post('/mcp/servers', (req, res) => {
    const { id, name, command, args, enabled = true } = req.body || {};

    if (!id || !command) {
      return res
        .status(400)
        .json({ error: 'id and command are required for an MCP server.' });
    }

    const config = readConfig();
    const servers = config.servers || [];
    const existingIndex = servers.findIndex((s) => s.id === id);

    const serverConfig = {
      id,
      name: typeof name === 'string' && name.trim() ? name.trim() : id,
      command,
      args: Array.isArray(args) ? args : [],
      enabled: !!enabled,
    };

    if (existingIndex >= 0) {
      servers[existingIndex] = serverConfig;
    } else {
      servers.push(serverConfig);
    }

    writeConfig({ servers });
    return res.json({ success: true, server: serverConfig });
  });

  return router;
};

