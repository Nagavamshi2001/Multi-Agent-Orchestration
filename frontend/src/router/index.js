import { createRouter, createWebHistory } from 'vue-router';
import ChatInterface from '../components/ChatInterface.vue';

const routes = [
  {
    path: '/',
    name: 'chat',
    component: ChatInterface,
    meta: { label: 'Chat' }
  },
  {
    path: '/integrations',
    name: 'integrations',
    component: () => import('../components/IntegrationsPanel.vue'),
    meta: { label: 'Integrations' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../components/SettingsPanel.vue'),
    meta: { label: 'Settings' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
