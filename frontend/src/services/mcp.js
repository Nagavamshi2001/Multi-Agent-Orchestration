import api from './apiClient.js';

export async function getMcpServers() {
  const { data } = await api.get('/api/mcp/servers');
  return data;
}

export async function saveMcpServer({ id, name, command, args, enabled }) {
  const { data } = await api.post('/api/mcp/servers', { id, name, command, args, enabled });
  return data;
}
