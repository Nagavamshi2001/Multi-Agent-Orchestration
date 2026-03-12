<template>
  <div class="app-root">
    <!-- Ambient background glows moved from ChatInterface -->
    <div class="ambient-glow bg-top-left"></div>
    <div class="ambient-glow bg-bottom-right"></div>

    <!-- Sidebar layout -->
    <SidebarMenu 
      v-if="currentUser"
      :nav-items="navItems" 
      :user="currentUser"
      :sessions="globalHistorySessions"
      :active-session-id="globalSessionId"
      :loading="globalHistoryLoading"
      @login="activeViewRef?.loginWithGoogle?.() || defaultLogin()"
      @logout="activeViewRef?.doLogout?.() || defaultLogout()"
      @open-session="handleOpenSession"
      @new-chat="handleNewChat"
    />

    <div class="app-content-wrapper">
      <AppHeader
        v-if="currentUser"
        :active-view-label="activeViewLabel"
        :active-view="activeView"
        :status-class="activeViewRef?.statusClass || 'ok'"
        :status-label="activeViewRef?.statusLabel || ''"
        :show-delete="activeViewRef?.hasMessages"
        @delete="activeViewRef?.deleteCurrentSession?.()"
      />
      <main class="app-shell-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <keep-alive include="ChatInterface">
              <component :is="Component" ref="activeViewRef" v-if="activeView === 'chat' || currentUser" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AppHeader, SidebarMenu } from './components/layout/index.js';
import { NAV_ITEMS } from './config/index.js';
import { API_BASE, logout, getMe } from './services/api.js';
import { globalHistorySessions, globalHistoryLoading, globalSessionId } from './store/chatState.js';

const route = useRoute();
const router = useRouter();

const navItems = NAV_ITEMS;
const activeView = computed(() => route.name);
const activeViewLabel = computed(() => route.meta?.label || 'App');

const activeViewRef = ref(null);
const globalUser = ref(null);
const isAuthChecked = ref(false);

onMounted(async () => {
  try {
    const res = await getMe();
    globalUser.value = res?.user || null;
  } catch (e) {
    globalUser.value = null;
  } finally {
    isAuthChecked.value = true;
  }
  
  if (!globalUser.value && activeView.value !== 'chat') {
    window.location.href = '/?login=true';
  }
});

watch([globalUser, activeView, isAuthChecked], ([user, view, checked]) => {
  if (checked && !user && view !== 'chat') {
    window.location.href = '/?login=true';
  }
});

// Use either the active view's user state (if it fetches it) or the global app user state
const currentUser = computed(() => activeViewRef.value?.me || globalUser.value);

function handleOpenSession(id) {
  if (activeView.value === 'chat') {
    activeViewRef.value?.openSession?.(id);
  } else {
    router.push('/').then(() => {
      nextTick(() => {
        activeViewRef.value?.openSession?.(id);
      });
    });
  }
}

function handleNewChat() {
  if (activeView.value === 'chat') {
    activeViewRef.value?.startNewChat?.();
  } else {
    router.push('/').then(() => {
      nextTick(() => {
        activeViewRef.value?.startNewChat?.();
      });
    });
  }
}

function defaultLogin() {
  const returnTo = window.location.href;
  window.history.replaceState({}, '', '/?login=true');
  window.location.href = `${API_BASE}/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
}

async function defaultLogout() {
  try {
    await logout();
  } catch (e) {}
  globalUser.value = null;
  if (activeViewRef.value && typeof activeViewRef.value.me !== 'undefined') {
    activeViewRef.value.me = null;
  }
  window.location.href = '/?login=true';
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@import './assets/main.css';

.app-root {
  height: 100vh;
  display: flex;
  flex-direction: row;
  background-color: var(--color-bg);
  color: var(--color-text);
  overflow: hidden;
  position: relative;
}

.ambient-glow {
  position: fixed;
  pointer-events: none;
  z-index: 0;
}
.ambient-glow.bg-top-left {
  top: -20%;
  left: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%); /* Primary: #8b5cf6 */
}
.ambient-glow.bg-bottom-right {
  bottom: -10%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%); /* Secondary: #06b6d4 */
}

.app-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  z-index: 1;
}

.app-shell-main {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
