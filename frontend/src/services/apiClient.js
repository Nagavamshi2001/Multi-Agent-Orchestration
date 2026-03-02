/**
 * Axios instance and base URLs for the backend API.
 */
import axios from 'axios';
import { API_BASE, WS_URL } from '../config/index.js';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export { API_BASE, WS_URL };
export const WS_BASE = WS_URL; // backwards compatibility
export default api;
