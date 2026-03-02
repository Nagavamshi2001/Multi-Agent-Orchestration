<template>
  <header class="app-shell-header glass">
    <div class="header-left">
      <button type="button" class="menu-btn" @click="$emit('openMenu')" aria-label="Open menu">
        <IconMenu />
      </button>
      <div class="header-context">
        <span class="context-label">{{ activeViewLabel }}</span>
      </div>
    </div>
    <button
      type="button"
      class="app-shell-center logo-button"
      @click="$emit('goToChat')"
      title="Go to chat"
      aria-label="Go to chat"
    >
      <div class="shell-logo-orb"><span>✦</span></div>
      <div class="shell-titles">
        <h1 class="shell-title">AI Agent Hub</h1>
        <p class="shell-subtitle">Personal multi-agent workspace assistant</p>
      </div>
    </button>
    <div class="app-shell-right">
      <button
        v-if="!user"
        type="button"
        class="btn-login"
        @click="$emit('login')"
        title="Sign in with Google"
      >
        Login
      </button>
      <div v-else class="user-pill" title="Signed in">
        <span class="user-email">{{ user.email }}</span>
        <button type="button" class="btn-logout" @click="$emit('logout')" title="Logout">
          Logout
        </button>
      </div>
      <button
        v-if="user && activeView === 'chat'"
        type="button"
        class="btn-history"
        @click="$emit('toggleHistory')"
        title="View chat history"
      >
        History
      </button>
      <StatusPill :status="statusClass" :label="statusLabel" />
      <button
        v-if="activeView === 'chat'"
        type="button"
        class="btn-new-chat"
        @click="$emit('newChat')"
        title="Start new chat"
      >
        New chat
      </button>
      <button
        v-if="activeView === 'chat'"
        type="button"
        class="btn-clear"
        @click="$emit('clear')"
        title="Clear conversation"
      >
        Clear
      </button>
    </div>
  </header>
</template>

<script setup>
import IconMenu from '../icons/IconMenu.vue';
import StatusPill from './StatusPill.vue';

defineProps({
  activeViewLabel: { type: String, default: 'Chat' },
  activeView: { type: String, default: 'chat' },
  user: { type: Object, default: null },
  statusClass: { type: String, default: 'checking' },
  statusLabel: { type: String, default: 'Connecting…' },
});
defineEmits(['openMenu', 'login', 'logout', 'toggleHistory', 'clear', 'newChat', 'goToChat']);
</script>

<style scoped>
.app-shell-header {
  height: 64px;
  padding: 12px 22px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
  z-index: 20;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-self: start;
}
.menu-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.35);
  color: rgba(226, 232, 240, 0.9);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}
.menu-btn:hover {
  border-color: rgba(129, 140, 248, 0.55);
  background: rgba(99, 102, 241, 0.12);
}
.header-context {
  display: flex;
  flex-direction: column;
}
.context-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(226, 232, 240, 0.85);
}
.app-shell-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.logo-button {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
  color: inherit;
  font: inherit;
}
.logo-button:hover {
  background: rgba(99, 102, 241, 0.1);
}
.logo-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.shell-logo-orb {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: white;
  box-shadow: 0 0 22px var(--color-primary-glow);
}
.shell-titles {
  display: flex;
  flex-direction: column;
}
.shell-title {
  font-size: 0.98rem;
  font-weight: 700;
  margin: 0;
}
.shell-subtitle {
  font-size: 0.72rem;
  margin: 0;
  color: var(--color-text-muted);
}
.app-shell-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-self: end;
}
.btn-new-chat {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.22);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.btn-new-chat:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.35);
}
.btn-clear {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.18);
  color: var(--color-error);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.btn-clear:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.35);
}
.btn-login {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.22);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}
.btn-login:hover {
  background: rgba(99, 102, 241, 0.18);
  border-color: rgba(99, 102, 241, 0.35);
}
.btn-history {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}
.btn-history:hover {
  background: rgba(148, 163, 184, 0.14);
  border-color: rgba(148, 163, 184, 0.28);
}
.user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 99px;
  border: 1px solid var(--color-border);
  background: rgba(15, 23, 42, 0.35);
}
.user-email {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-logout {
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  opacity: 0.85;
}
.btn-logout:hover {
  opacity: 1;
}
</style>
