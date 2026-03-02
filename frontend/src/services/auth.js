import api from './apiClient.js';

export async function getMe() {
  const { data } = await api.get('/api/auth/me');
  return data;
}

export async function logout() {
  const { data } = await api.post('/api/auth/logout');
  return data;
}
