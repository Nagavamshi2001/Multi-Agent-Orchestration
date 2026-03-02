<template>
  <div
    v-if="modelValue"
    class="mcp-backdrop"
    @click.self="$emit('update:modelValue', false)"
  >
    <div class="mcp-drawer glass">
      <div class="mcp-header">
        <div class="mcp-title">MCP servers</div>
        <div class="mcp-actions">
          <button class="mcp-btn" @click="loadServers" :disabled="loading">
            Refresh
          </button>
          <button
            class="mcp-btn close"
            @click="$emit('update:modelValue', false)"
          >
            Close
          </button>
        </div>
      </div>

      <div v-if="loading" class="mcp-loading">Loading…</div>
      <div v-else-if="error" class="mcp-error">{{ error }}</div>

      <div v-else class="mcp-content">
        <div class="mcp-list">
          <div
            v-for="s in servers"
            :key="s.id"
            class="mcp-item"
            @click="editServer(s)"
          >
            <div class="mcp-item-row">
              <span class="mcp-item-title">{{ s.name || s.id }}</span>
              <span
                class="mcp-item-badge"
                :class="{ disabled: s.enabled === false }"
              >
                {{ s.enabled === false ? 'Disabled' : 'Enabled' }}
              </span>
            </div>
            <div class="mcp-item-sub">
              <code>{{ s.command }} {{ (s.args || []).join(' ') }}</code>
            </div>
          </div>
          <div v-if="servers.length === 0" class="mcp-empty">
            No MCP servers configured yet.
          </div>
        </div>

        <div class="mcp-form">
          <div class="mcp-form-title">
            {{ editingId ? 'Edit server' : 'Add server' }}
          </div>
          <div class="mcp-form-grid">
            <label class="mcp-field">
              <span>Id</span>
              <input v-model="form.id" placeholder="unique-id" />
            </label>
            <label class="mcp-field">
              <span>Name</span>
              <input v-model="form.name" placeholder="Friendly name" />
            </label>
          </div>
          <label class="mcp-field">
            <span>Command</span>
            <input v-model="form.command" placeholder="node" />
          </label>
          <label class="mcp-field">
            <span>Args (space-separated)</span>
            <input
              v-model="form.argsText"
              placeholder="./src/mcp/server.js --flag"
            />
          </label>
          <label class="mcp-checkbox">
            <input type="checkbox" v-model="form.enabled" />
            <span>Enabled</span>
          </label>

          <div class="mcp-form-actions">
            <button class="mcp-btn primary" @click="save" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save server' }}
            </button>
            <button class="mcp-btn ghost" @click="resetForm" :disabled="saving">
              Clear form
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getMcpServers, saveMcpServer } from '../services/api.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

defineEmits(['update:modelValue']);

const servers = ref([]);
const loading = ref(false);
const error = ref(null);
const saving = ref(false);
const editingId = ref(null);

const form = ref({
  id: '',
  name: '',
  command: '',
  argsText: '',
  enabled: true,
});

const loadServers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await getMcpServers();
    servers.value = res.servers || [];
  } catch (e) {
    error.value =
      e?.response?.data?.error || e?.message || 'Failed to load MCP servers';
  } finally {
    loading.value = false;
  }
};

const editServer = (s) => {
  editingId.value = s.id;
  form.value = {
    id: s.id,
    name: s.name || s.id,
    command: s.command || '',
    argsText: (s.args || []).join(' '),
    enabled: s.enabled !== false,
  };
};

const resetForm = () => {
  editingId.value = null;
  form.value = {
    id: '',
    name: '',
    command: '',
    argsText: '',
    enabled: true,
  };
};

const save = async () => {
  if (!form.value.id || !form.value.command) {
    error.value = 'Id and command are required.';
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const args =
      form.value.argsText.trim() === ''
        ? []
        : form.value.argsText.trim().split(/\s+/);
    await saveMcpServer({
      id: form.value.id,
      name: form.value.name,
      command: form.value.command,
      args,
      enabled: form.value.enabled,
    });
    await loadServers();
    editingId.value = form.value.id;
  } catch (e) {
    error.value =
      e?.response?.data?.error || e?.message || 'Failed to save MCP server';
  } finally {
    saving.value = false;
  }
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      loadServers();
    }
  },
);
</script>

<style scoped>
.mcp-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(10px);
  z-index: 60;
  display: flex;
  justify-content: flex-end;
}
.mcp-drawer {
  width: min(520px, 92vw);
  height: 100%;
  border-left: 1px solid var(--color-border);
  padding: 16px;
  display: flex;
  flex-direction: column;
}
.mcp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}
.mcp-title {
  font-weight: 800;
  letter-spacing: 0.02em;
}
.mcp-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.mcp-btn {
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
.mcp-btn:hover {
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(99, 102, 241, 0.08);
}
.mcp-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.mcp-btn.close:hover {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
}
.mcp-btn.primary {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.5);
  color: var(--color-primary);
}
.mcp-btn.primary:hover {
  background: rgba(99, 102, 241, 0.3);
}
.mcp-btn.ghost {
  background: transparent;
}
.mcp-loading,
.mcp-error,
.mcp-empty {
  padding: 12px 2px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
.mcp-error {
  color: var(--color-error);
}
.mcp-content {
  padding-top: 12px;
  display: grid;
  grid-template-columns: 1.1fr 1.1fr;
  gap: 16px;
  height: 100%;
}
.mcp-list {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mcp-item {
  border-radius: var(--radius-md);
  padding: 10px 10px;
  border: 1px solid var(--color-border);
  background: rgba(15, 23, 42, 0.25);
  cursor: pointer;
  transition: var(--transition);
}
.mcp-item:hover {
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(99, 102, 241, 0.08);
}
.mcp-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.mcp-item-title {
  font-weight: 700;
  font-size: 0.9rem;
}
.mcp-item-badge {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: #bbf7d0;
  background: rgba(22, 163, 74, 0.15);
}
.mcp-item-badge.disabled {
  border-color: rgba(148, 163, 184, 0.5);
  color: #cbd5f5;
  background: rgba(30, 41, 59, 0.6);
}
.mcp-item-sub {
  margin-top: 6px;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
.mcp-item-sub code {
  font-size: 0.76rem;
}
.mcp-form {
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: rgba(15, 23, 42, 0.3);
  padding: 12px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mcp-form-title {
  font-weight: 700;
  font-size: 0.9rem;
}
.mcp-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.mcp-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.78rem;
}
.mcp-field > span {
  color: var(--color-text-muted);
}
.mcp-field input {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: rgba(15, 23, 42, 0.7);
  padding: 6px 8px;
  color: var(--color-text);
  font-size: 0.8rem;
}
.mcp-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.mcp-form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
}

@media (max-width: 900px) {
  .mcp-content {
    grid-template-columns: 1fr;
  }
}
</style>

