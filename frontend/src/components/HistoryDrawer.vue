<template>
  <div v-if="modelValue" class="history-backdrop" @click.self="$emit('update:modelValue', false)">
    <div class="history-drawer glass">
      <div class="history-header">
        <div class="history-title">Chat history</div>
        <div class="history-actions">
          <button class="history-btn" @click="$emit('new-chat')" :disabled="loading">New chat</button>
          <button class="history-btn" @click="$emit('refresh')" :disabled="loading">Refresh</button>
          <button class="history-btn close" @click="$emit('update:modelValue', false)">Close</button>
        </div>
      </div>

      <div v-if="loading" class="history-loading">Loading…</div>
      <div v-else-if="error" class="history-error">{{ error }}</div>
      <div v-else class="history-list">
        <button
          v-for="s in sessions"
          :key="s.id"
          class="history-item"
          :class="{ active: s.id === activeSessionId }"
          @click="$emit('open', s.id)"
        >
          <div class="history-item-title">{{ s.title || 'Untitled chat' }}</div>
          <div class="history-item-sub">
            <span class="history-item-date">{{ formatMs(s.updated_at || s.created_at) }}</span>
            <span v-if="s.last_message_preview" class="history-item-preview">{{ s.last_message_preview }}</span>
          </div>
        </button>
        <div v-if="sessions.length === 0" class="history-empty">No saved chats yet.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  sessions: { type: Array, default: () => [] },
  activeSessionId: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
});

defineEmits(['update:modelValue', 'open', 'new-chat', 'refresh']);

const formatMs = (ms) => {
  const n = Number(ms);
  if (!n) return '';
  try {
    return new Date(n).toLocaleString();
  } catch {
    return '';
  }
};
</script>

<style scoped>
.history-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(10px);
  z-index: 60;
  display: flex;
  justify-content: flex-end;
}
.history-drawer {
  width: min(520px, 92vw);
  height: 100%;
  border-left: 1px solid var(--color-border);
  padding: 16px;
  display: flex;
  flex-direction: column;
}
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}
.history-title {
  font-weight: 800;
  letter-spacing: 0.02em;
}
.history-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.history-btn {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: rgba(15, 23, 42, 0.25);
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}
.history-btn:hover { border-color: rgba(99, 102, 241, 0.35); background: rgba(99, 102, 241, 0.08); }
.history-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.history-btn.close:hover { border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.08); }
.history-loading,
.history-error,
.history-empty {
  padding: 12px 2px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
.history-error { color: var(--color-error); }
.history-list {
  padding-top: 12px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.history-item {
  text-align: left;
  border-radius: var(--radius-md);
  padding: 12px 12px;
  border: 1px solid var(--color-border);
  background: rgba(15, 23, 42, 0.25);
  cursor: pointer;
  transition: var(--transition);
}
.history-item:hover {
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(99, 102, 241, 0.08);
}
.history-item.active {
  border-color: rgba(99, 102, 241, 0.55);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18);
}
.history-item-title {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--color-text);
}
.history-item-sub {
  margin-top: 6px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
.history-item-preview {
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 360px;
}
</style>
