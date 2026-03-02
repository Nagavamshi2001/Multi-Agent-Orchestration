/**
 * Frontend app config: nav items, view ids, and env-derived URLs.
 */
export const VIEW_IDS = {
  CHAT: 'chat',
  INTEGRATIONS: 'integrations',
  SETTINGS: 'settings',
};

export const NAV_ITEMS = [
  { id: VIEW_IDS.CHAT, label: 'Chat' },
  { id: VIEW_IDS.INTEGRATIONS, label: 'Integrations' },
  { id: VIEW_IDS.SETTINGS, label: 'Settings' },
];

export const VIEW_LABELS = {
  [VIEW_IDS.CHAT]: 'Chat',
  [VIEW_IDS.INTEGRATIONS]: 'Integrations',
  [VIEW_IDS.SETTINGS]: 'Settings',
};

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
