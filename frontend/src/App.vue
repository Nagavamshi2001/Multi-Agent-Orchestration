<template>
  <div class="app-root">
    <AppHeader
      :active-view-label="activeViewLabel"
      :active-view="activeView"
      :user="chatMe"
      :status-class="chatStatusClass"
      :status-label="chatStatusLabel"
      @open-menu="sidebarOpen = true"
      @login="chatRef?.loginWithGoogle?.()"
      @logout="chatRef?.doLogout?.()"
      @toggle-history="chatRef?.toggleHistory?.()"
      @new-chat="chatRef?.startNewChat?.()"
      @clear="chatRef?.clearChat?.()"
      @go-to-chat="selectView('chat')"
    />
    <main class="app-shell-main">
      <ChatInterface ref="chatRef" v-show="activeView === 'chat'" />
      <IntegrationsPanel v-show="activeView === 'integrations'" />
      <SettingsPanel v-show="activeView === 'settings'" />
    </main>
    <SidebarMenu
      v-model="sidebarOpen"
      :nav-items="navItems"
      :active-view="activeView"
      @select="selectView"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { AppHeader, SidebarMenu } from './components/layout/index.js';
import ChatInterface from './components/ChatInterface.vue';
import IntegrationsPanel from './components/IntegrationsPanel.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import { useNavigation } from './composables/useNavigation.js';

const { navItems, activeView, sidebarOpen, activeViewLabel, selectView } = useNavigation();
const chatRef = ref(null);

const chatMe = computed(() => chatRef.value?.me ?? null);
const chatStatusClass = computed(() => chatRef.value?.statusClass ?? 'checking');
const chatStatusLabel = computed(() => chatRef.value?.statusLabel ?? 'Connecting…');
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@import './assets/main.css';

.app-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 55%),
    radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.2), transparent 55%),
    #020617;
  color: var(--color-text);
}

.app-shell-main {
  flex: 1;
  min-height: 0;
}
</style>
