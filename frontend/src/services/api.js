import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

export { API_BASE, WS_BASE };

const api = axios.create({
    baseURL: API_BASE,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

export const sendMessage = async (message, sessionId) => {
    const { data } = await api.post('/api/chat', { message, sessionId });
    return data;
};

export const checkHealth = async () => {
    const { data } = await api.get('/api/health');
    return data;
};

export const clearSession = async (sessionId) => {
    const { data } = await api.delete(`/api/chat/${sessionId}`);
    return data;
};

export const getMe = async () => {
    const { data } = await api.get('/api/auth/me');
    return data;
};

export const logout = async () => {
    const { data } = await api.post('/api/auth/logout');
    return data;
};

export default api;
