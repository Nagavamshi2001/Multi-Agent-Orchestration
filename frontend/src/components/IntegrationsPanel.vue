<template>
  <div class="integrations-root">
    <section class="integrations-hero">
      <h2>Integrations</h2>
      <p>
        Connect AI Agent Hub with the tools you already use. Manage secure single sign-on
        and advanced tool backends from one clean control panel.
      </p>
    </section>

    <section class="integrations-grid">
      <article class="integration-card">
        <div class="integration-header">
          <div class="integration-icon google">
            <span>G</span>
          </div>
          <div>
            <h3>Google Workspace</h3>
            <p>Email, Calendar, Tasks via secure OAuth</p>
          </div>
        </div>
        <div class="integration-body">
          <div class="status-row">
            <span
              class="status-chip"
              :class="me?.google_sub ? 'connected' : 'disconnected'"
            >
              <span class="dot"></span>
              {{ me?.google_sub ? 'Connected' : 'Not connected' }}
            </span>
            <span class="status-detail">
              {{ me?.google_sub ? me.email : 'Sign in with Google to enable workspace tools.' }}
            </span>
          </div>
        </div>
        <div class="integration-footer">
          <button class="btn primary" @click="handleGoogleClick">
            {{ me?.google_sub ? 'Disconnect' : 'Connect Google' }}
          </button>
        </div>
      </article>

      <article class="integration-card">
        <div class="integration-header">
          <div class="integration-icon mcp">
            <span>⌘</span>
          </div>
          <div>
            <h3>Model Context Protocol (MCP)</h3>
            <p>Connect external tool servers for advanced workflows</p>
          </div>
        </div>
        <div class="integration-body">
          <div class="status-row">
            <span class="status-chip neutral">
              <span class="dot"></span>
              {{ servers.length ? servers.length + ' configured' : 'No servers yet' }}
            </span>
            <span class="status-detail">
              MCP servers power tool calls from compatible AI clients.
            </span>
          </div>
        </div>
        <div class="integration-footer">
          <button class="btn ghost" @click="openMcpModal">
            Manage MCP servers
          </button>
        </div>
      </article>
    </section>

    <Transition name="fade-scale">
      <div
        v-if="showMcp"
        class="modal-backdrop"
        @click.self="closeMcpModal"
      >
        <div class="modal-card glass">
          <header class="modal-header">
            <div>
              <h3>MCP servers</h3>
              <p>Configure external MCP servers available to your AI tools.</p>
            </div>
            <button class="icon-btn" @click="closeMcpModal" aria-label="Close">
              ✕
            </button>
          </header>

          <div v-if="loading" class="modal-body muted">
            Loading servers…
          </div>
          <div v-else-if="error" class="modal-body error">
            {{ error }}
          </div>
          <div v-else class="modal-body layout">
            <div class="servers-panel">
              <div class="servers-header">
                <span class="panel-title">Configured servers</span>
                <div class="servers-actions">
                  <button class="btn ghost small" type="button" @click="loadServers">
                    Refresh
                  </button>
                  <button class="btn ghost small" type="button" @click="startCreate">
                    New
                  </button>
                </div>
              </div>
              <div v-if="servers.length === 0" class="empty-state">
                <p>No MCP servers configured yet.</p>
                <p class="hint">
                  Add your first server on the right to connect tools like databases,
                  APIs, or custom backends.
                </p>
              </div>
              <ul v-else class="server-list">
                <li
                  v-for="s in servers"
                  :key="s.id"
                  class="server-row"
                  :class="{ active: editingId === s.id }"
                  @click="editServer(s)"
                >
                  <div class="server-main">
                    <span class="server-name">{{ s.name || s.id }}</span>
                    <span
                      class="pill"
                      :class="s.enabled === false ? 'pill-off' : 'pill-on'"
                    >
                      {{ s.enabled === false ? 'Disabled' : 'Enabled' }}
                    </span>
                  </div>
                  <div class="server-sub">
                    <code>{{ s.command }} {{ (s.args || []).join(' ') }}</code>
                  </div>
                </li>
              </ul>
            </div>

            <div class="form-panel">
              <div class="servers-header">
                <span class="panel-title">
                  {{ editingId ? 'Edit server' : 'Create new server' }}
                </span>
              </div>
              <form class="form-grid" @submit.prevent="save">
                <label class="field">
                  <span>Id</span>
                  <input
                    v-model="form.id"
                    placeholder="unique-id (no spaces)"
                    autocomplete="off"
                  />
                </label>
                <label class="field">
                  <span>Name</span>
                  <input
                    v-model="form.name"
                    placeholder="Friendly display name"
                    autocomplete="off"
                  />
                </label>
                <label class="field">
                  <span>Command</span>
                  <input
                    v-model="form.command"
                    placeholder="e.g. node"
                    autocomplete="off"
                  />
                </label>
                <label class="field">
                  <span>Arguments</span>
                  <input
                    v-model="form.argsText"
                    placeholder="./src/mcp/server.js --flag"
                    autocomplete="off"
                  />
                  <small>Space-separated arguments passed to the command.</small>
                </label>
                <label class="toggle-row">
                  <input type="checkbox" v-model="form.enabled" />
                  <span>Server is enabled</span>
                </label>
                <div class="form-actions">
                  <button class="btn primary" type="submit" :disabled="saving">
                    {{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Create server' }}
                  </button>
                  <button
                    class="btn ghost"
                    type="button"
                    :disabled="saving"
                    @click="resetForm"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import {
  API_BASE,
  getMe,
  getMcpServers,
  saveMcpServer,
  logout,
  disconnectGoogle,
} from '../services/api.js';

const me = ref(null);
const servers = ref([]);
const loading = ref(false);
const error = ref(null);
const saving = ref(false);
const showMcp = ref(false);
const editingId = ref(null);

const form = ref({
  id: '',
  name: '',
  command: '',
  argsText: '',
  enabled: true,
});

const fetchMe = async () => {
  try {
    const res = await getMe();
    me.value = res.user || null;
  } catch {
    me.value = null;
  }
};

const handleGoogleClick = async () => {
  if (!me.value?.google_sub) {
    const returnTo = window.location.href;
    window.location.href = `${API_BASE}/api/auth/google/start?returnTo=${encodeURIComponent(
      returnTo,
    )}`;
  } else {
    try {
      // Disconnect Google from the user's account
      await disconnectGoogle();
      
      // If the user doesn't have a password set up, they were purely using SSO.
      // Now that they disconnected, they can't log in anymore, so log them out.
      if (!me.value?.has_password) {
        await logout();
        me.value = null;
        window.location.href = '/?login=true';
      } else {
        // Otherwise, just fetch updated user state
        await fetchMe();
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }
};

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

const openMcpModal = async () => {
  showMcp.value = true;
  await loadServers();
};

const closeMcpModal = () => {
  showMcp.value = false;
};

const startCreate = () => {
  resetForm();
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

onMounted(async () => {
  await fetchMe();
  await loadServers();
});
</script>

<style scoped>
.integrations-root {
  height: 100%;
  padding: 24px 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.integrations-hero h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.integrations-hero p {
  max-width: 560px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.integrations-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: flex-start;
}

.integration-card {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.96));
  padding: 14px 16px 12px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.7);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.integration-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.integration-icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  color: white;
}

.integration-icon.google {
  background: conic-gradient(from 180deg, #4285f4, #34a853, #fbbc05, #ea4335, #4285f4);
}

.integration-icon.mcp {
  background: linear-gradient(135deg, #22c55e, #0ea5e9);
}

.integration-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}

.integration-header p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.integration-body {
  font-size: 0.8rem;
}

.status-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.status-chip .dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
}

.status-chip.connected {
  border-color: rgba(34, 197, 94, 0.6);
  background: rgba(22, 163, 74, 0.22);
  color: #bbf7d0;
}

.status-chip.connected .dot {
  background: #22c55e;
}

.status-chip.disconnected {
  border-color: rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.8);
  color: #e5e7eb;
}

.status-chip.disconnected .dot {
  background: #64748b;
}

.status-chip.neutral {
  border-color: rgba(129, 140, 248, 0.5);
  background: rgba(55, 65, 81, 0.55);
  color: #e5e7eb;
}

.status-chip.neutral .dot {
  background: #818cf8;
}

.status-detail {
  color: var(--color-text-muted);
}

.integration-footer {
  display: flex;
  justify-content: flex-end;
}

.btn {
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 14px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: var(--transition);
}

.btn.primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-color: rgba(129, 140, 248, 0.9);
  color: #f9fafb;
  box-shadow: 0 8px 24px var(--color-primary-glow);
}

.btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px var(--color-primary-glow);
}

.btn.ghost {
  background: transparent;
  border-color: rgba(148, 163, 184, 0.6);
  color: var(--color-text);
}

.btn.ghost.small {
  padding: 4px 10px;
  font-size: 0.75rem;
}

.btn.ghost:hover {
  background: rgba(148, 163, 184, 0.14);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.96));
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 80;
}

.modal-card {
  width: min(960px, 96vw);
  max-height: 88vh;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.98));
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.85);
  padding: 16px 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  border-bottom: 1px solid rgba(51, 65, 85, 0.9);
  padding-bottom: 8px;
}

.modal-header h3 {
  margin: 0;
  font-size: 0.98rem;
}

.modal-header p {
  margin: 3px 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.icon-btn {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: transparent;
  color: var(--color-text-muted);
  width: 26px;
  height: 26px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: rgba(148, 163, 184, 0.18);
  color: var(--color-text);
}

.modal-body {
  font-size: 0.82rem;
}

.modal-body.muted {
  color: var(--color-text-muted);
}

.modal-body.error {
  color: var(--color-error);
}

.modal-body.layout {
  display: grid;
  grid-template-columns: 1.1fr 1.1fr;
  gap: 16px;
  padding-top: 4px;
  max-height: calc(88vh - 80px);
}

.servers-panel,
.form-panel {
  border-radius: 16px;
  border: 1px solid rgba(31, 41, 55, 0.9);
  background: rgba(15, 23, 42, 0.9);
  padding: 10px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.servers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.servers-actions {
  display: inline-flex;
  gap: 6px;
}

.panel-title {
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.empty-state {
  padding: 10px 4px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.empty-state .hint {
  margin-top: 4px;
  font-size: 0.78rem;
  opacity: 0.9;
}

.server-list {
  list-style: none;
  margin: 0;
  padding: 4px 0 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.server-row {
  border-radius: 10px;
  border: 1px solid rgba(51, 65, 85, 0.9);
  padding: 8px 9px;
  cursor: pointer;
  transition: var(--transition);
  background: rgba(15, 23, 42, 0.95);
}

.server-row:hover {
  border-color: rgba(129, 140, 248, 0.7);
  background: rgba(30, 64, 175, 0.45);
}

.server-row.active {
  border-color: rgba(129, 140, 248, 0.9);
  box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.5);
}

.server-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.server-name {
  font-weight: 600;
}

.pill {
  font-size: 0.7rem;
  padding: 2px 7px;
  border-radius: 999px;
}

.pill-on {
  background: rgba(22, 163, 74, 0.3);
  color: #bbf7d0;
}

.pill-off {
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5f5;
}

.server-sub {
  margin-top: 4px;
  font-size: 0.76rem;
  color: var(--color-text-muted);
}

.server-sub code {
  font-size: 0.76rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.field > span {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.field input {
  border-radius: 10px;
  border: 1px solid rgba(51, 65, 85, 0.9);
  background: rgba(15, 23, 42, 0.96);
  padding: 6px 9px;
  color: var(--color-text);
  font-size: 0.8rem;
}

.field small {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

@media (max-width: 960px) {
  .integrations-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 840px) {
  .modal-body.layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .integrations-root {
    padding: 18px 14px;
  }
}
</style>

