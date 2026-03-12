<template>
  <div class="settings-root">
    <section class="settings-hero">
      <h2>Settings</h2>
      <p>Manage your personal preferences and workspace configuration.</p>
    </section>

    <div v-if="!me" class="settings-login-required">
      <p>Sign in to view and save settings.</p>
    </div>

    <div v-else class="settings-container">
      <!-- Tabs Navigation -->
      <nav class="settings-tabs" aria-label="Settings tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'user' }" 
          @click="activeTab = 'user'"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          User Settings
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'workspace' }" 
          @click="activeTab = 'workspace'"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          Workspace
        </button>
      </nav>

      <div class="tab-content">
        <transition name="fade-tab" mode="out-in">
          <!-- User Settings Tab -->
          <div v-if="activeTab === 'user'" class="settings-form-wrap" key="user">
            <!-- Account Security Section -->
            <div class="settings-form glass form-security">
              <div class="form-section">
                <h3>Account Security</h3>
                <p class="form-desc">Manage your password.</p>
                
                <form @submit.prevent="handlePasswordChange">
                  <!-- Only show current password field if the user already has a password set -->
                  <div v-if="me.has_password" class="field">
                    <span>Current Password</span>
                    <input
                      v-model="passwordForm.currentPassword"
                      type="password"
                      placeholder="Required to update password"
                      required
                    />
                  </div>
                  
                  <div class="field">
                    <span>{{ me.has_password ? 'New Password' : 'Set Password' }}</span>
                    <input
                      v-model="passwordForm.newPassword"
                      type="password"
                      placeholder="Min 6 characters"
                      required
                      minlength="6"
                    />
                  </div>

                  <div class="field">
                    <span>Confirm Password</span>
                    <input
                      v-model="passwordForm.confirmPassword"
                      type="password"
                      placeholder="********"
                      required
                      minlength="6"
                    />
                  </div>

                  <div class="form-actions">
                    <button type="submit" class="btn primary" :disabled="passwordSaving">
                      {{ passwordSaving ? 'Saving...' : (me.has_password ? 'Update Password' : 'Set Password') }}
                    </button>
                  </div>
                  
                  <p v-if="passwordMessage" class="form-message" :class="{ error: isPasswordError }">
                    {{ passwordMessage }}
                  </p>
                </form>
              </div>
            </div>
          </div>

          <!-- Workspace Settings Tab -->
          <div v-else-if="activeTab === 'workspace'" class="settings-form-wrap" key="workspace">
            <!-- New form: add key when none saved -->
            <form
              v-if="!hasOpenaiKey"
              class="settings-form glass form-new"
              @submit.prevent="save"
            >
              <div class="form-section">
                <h3>Data privacy</h3>
                <label class="field field-checkbox">
                  <input
                    v-model="form.allowAgentReadDocsSheets"
                    type="checkbox"
                  />
                  <span>Allow agent to read document and spreadsheet content</span>
                </label>
                <p class="form-desc">When enabled, the agent can summarize or answer questions about your Google Docs and Sheets content. When disabled (default), the agent only sees links and metadata.</p>
              </div>
              <div class="form-section">
                <h3>Add API key</h3>
                <p class="form-desc">Enter your OpenAI API key and choose a model. These are stored securely per account.</p>
                <label class="field">
                  <span>API key</span>
                  <input
                    v-model="form.openaiApiKey"
                    type="password"
                    placeholder="sk-..."
                    autocomplete="off"
                    required
                  />
                </label>
                <label class="field">
                  <span>Model</span>
                  <select v-model="form.model">
                    <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
                  </select>
                </label>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn primary" :disabled="saving || !form.openaiApiKey?.trim()">
                  {{ saving ? 'Saving…' : 'Save key & model' }}
                </button>
              </div>
              <p v-if="message" class="form-message" :class="{ error: isError }">
                {{ message }}
              </p>
            </form>

            <!-- Edit form: when key already exists -->
            <form
              v-else
              class="settings-form glass form-edit"
              @submit.prevent="save"
            >
              <div class="form-section">
                <h3>Data privacy</h3>
                <label class="field field-checkbox">
                  <input
                    v-model="form.allowAgentReadDocsSheets"
                    type="checkbox"
                  />
                  <span>Allow agent to read document and spreadsheet content</span>
                </label>
                <p class="form-desc">When enabled, the agent can summarize or answer questions about your Google Docs and Sheets content. When disabled (default), the agent only sees links and metadata.</p>
              </div>
              <div class="form-section">
                <h3>Edit existing</h3>
                <p class="form-desc">Update your saved key or model.</p>
                <div class="field key-saved">
                  <span>API key</span>
                  <div class="key-value">
                    <span class="key-mask">••••••••••••</span>
                    <span class="key-label">Saved</span>
                  </div>
                </div>
                <label class="field">
                  <span>Replace key (optional)</span>
                  <input
                    v-model="form.openaiApiKey"
                    type="password"
                    placeholder="Leave blank to keep current key"
                    autocomplete="off"
                  />
                </label>
                <label class="field">
                  <span>Model</span>
                  <select v-model="form.model">
                    <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
                  </select>
                </label>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn primary" :disabled="saving">
                  {{ saving ? 'Saving…' : 'Update settings' }}
                </button>
              </div>
              <p v-if="message" class="form-message" :class="{ error: isError }">
                {{ message }}
              </p>
            </form>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getMe, getSettings, saveSettings, changePassword } from '../services/api.js';

const me = ref(null);
const activeTab = ref('user');

// Workspace form state
const form = ref({ openaiApiKey: '', model: 'gpt-4o', allowAgentReadDocsSheets: false });
const models = ref(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']);
const hasOpenaiKey = ref(false);
const saving = ref(false);
const message = ref(null);
const isError = ref(false);

// User form state
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const passwordSaving = ref(false);
const passwordMessage = ref(null);
const isPasswordError = ref(false);

const load = async () => {
  try {
    const userRes = await getMe();
    me.value = userRes.user || null;
    if (!me.value) return;
    const res = await getSettings();
    hasOpenaiKey.value = res.hasOpenaiKey ?? false;
    form.value.model = res.model || 'gpt-4o';
    if (res.models && res.models.length) models.value = res.models;
    form.value.openaiApiKey = '';
  } catch {
    me.value = null;
  }
};

const save = async () => {
  if (!me.value) return;
  saving.value = true;
  message.value = null;
  isError.value = false;
  try {
    await saveSettings({
      openaiApiKey: form.value.openaiApiKey || undefined,
      model: form.value.model,
      allowAgentReadDocsSheets: form.value.allowAgentReadDocsSheets,
    });
    hasOpenaiKey.value = true;
    form.value.openaiApiKey = '';
    message.value = 'Workspace settings saved.';
  } catch (e) {
    isError.value = true;
    message.value = e?.response?.data?.error || e?.message || 'Failed to save settings.';
  } finally {
    saving.value = false;
  }
};

const handlePasswordChange = async () => {
  if (!me.value) return;

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    isPasswordError.value = true;
    passwordMessage.value = 'Passwords do not match.';
    return;
  }

  if (passwordForm.value.newPassword.length < 6) {
    isPasswordError.value = true;
    passwordMessage.value = 'Password must be at least 6 characters.';
    return;
  }

  passwordSaving.value = true;
  passwordMessage.value = null;
  isPasswordError.value = false;

  try {
    await changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    );
    passwordMessage.value = 'Password updated successfully.';
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    // Refresh user to update has_password status if needed
    const userRes = await getMe();
    me.value = userRes.user || null;
  } catch (e) {
    isPasswordError.value = true;
    passwordMessage.value = e?.response?.data?.error || e?.message || 'Failed to update password.';
  } finally {
    passwordSaving.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.settings-root {
  height: 100%;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-hero h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.settings-hero p {
  max-width: 560px;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.settings-login-required {
  padding: 20px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.4);
  color: var(--color-text-muted);
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Tabs Navigation */
.settings-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  padding-bottom: 1px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-btn:hover {
  color: var(--color-text);
}

.tab-btn.active {
  color: var(--color-primary);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px 2px 0 0;
}

/* Form Styles */
.settings-form-wrap {
  max-width: 480px;
}

.settings-form {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 6px 0;
}

.form-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.key-saved .key-value {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(51, 65, 85, 0.9);
  background: rgba(15, 23, 42, 0.9);
}

.key-mask {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
}

.key-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-left: auto;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.field > span {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.field input,
.field select {
  border-radius: 10px;
  border: 1px solid rgba(51, 65, 85, 0.9);
  background: rgba(15, 23, 42, 0.9);
  padding: 10px 12px;
  color: var(--color-text);
  font-size: 0.85rem;
  transition: border-color 0.2s;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.6);
}

.field small {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.form-actions {
  margin-top: 12px;
}

.btn.primary {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn.primary:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.btn.primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.form-message {
  font-size: 0.85rem;
  margin: 12px 0 0 0;
  color: var(--color-success);
}

.form-message.error {
  color: var(--color-error);
}

.field-checkbox {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.field-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--color-primary);
}

.field-checkbox > span {
  margin-bottom: 0;
}

/* Transitions */
.fade-tab-enter-active,
.fade-tab-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-tab-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.fade-tab-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
