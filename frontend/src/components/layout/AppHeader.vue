<template>
  <header class="app-shell-header">
    <div class="header-left">
      <h2 class="context-label">{{ activeViewLabel }}</h2>
    </div>
    <div class="app-shell-right">
      <StatusPill :status="statusClass" :label="statusLabel" />
      
      <button
        v-if="activeView === 'chat' && showDelete"
        type="button"
        class="btn-action ghost danger"
        @click="$emit('delete')"
        title="Delete conversation"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
        Delete
      </button>
    </div>
  </header>
</template>

<script setup>
import StatusPill from './StatusPill.vue';

defineProps({
  activeViewLabel: { type: String, default: 'Chat' },
  activeView: { type: String, default: 'chat' },
  statusClass: { type: String, default: 'checking' },
  statusLabel: { type: String, default: 'Connecting…' },
  showDelete: { type: Boolean, default: false },
});

defineEmits(['delete']);
</script>

<style scoped>
.app-shell-header {
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  z-index: 20;
}
.header-left {
  display: flex;
  align-items: center;
}
.context-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.app-shell-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  border: 1px solid transparent;
}

.btn-action.ghost {
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.15);
  color: var(--color-text);
}
.btn-action.ghost:hover {
  background: rgba(148, 163, 184, 0.15);
}

.btn-action.danger {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.15);
  color: var(--color-error);
}
.btn-action.danger:hover {
  background: rgba(239, 68, 68, 0.15);
}
</style>
