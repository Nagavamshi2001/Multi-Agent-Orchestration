import api from './apiClient.js';

export async function getMe() {
  const { data } = await api.get('/api/auth/me');
  return data;
}

export async function logout() {
  const { data } = await api.post('/api/auth/logout');
  return data;
}

export async function login(email, password) {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data;
}

export async function register(email, password, name) {
  const { data } = await api.post('/api/auth/register', { email, password, name });
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post('/api/auth/change-password', { currentPassword, newPassword });
  return data;
}

export async function disconnectGoogle() {
  const { data } = await api.post('/api/auth/google/disconnect');
  return data;
}
