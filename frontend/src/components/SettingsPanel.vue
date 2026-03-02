<template>
  <div class="settings-root">
    <section class="settings-hero">
      <h2>Settings</h2>
      <p>
        Configure your OpenAI API key and model. Stored per account and used for chat and agents.
      </p>
    </section>

    <div v-if="!me" class="settings-login-required">
      <p>Sign in to view and save settings.</p>
    </div>

    <section v-else class="settings-form-wrap">
      <!-- New form: add key when none saved -->
      <form
        v-if="!hasOpenaiKey"
        class="settings-form glass form-new"
        @submit.prevent="save"
      >
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
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getMe, getSettings, saveSettings } from '../services/api.js';

const me = ref(null);
const form = ref({ openaiApiKey: '', model: 'gpt-4o' });
const models = ref(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']);
const hasOpenaiKey = ref(false);
const saving = ref(false);
const message = ref(null);
const isError = ref(false);

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
    });
    hasOpenaiKey.value = true;
    form.value.openaiApiKey = '';
    message.value = 'Settings saved.';
  } catch (e) {
    isError.value = true;
    message.value = e?.response?.data?.error || e?.message || 'Failed to save settings.';
  } finally {
    saving.value = false;
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
  gap: 20px;
}

.settings-hero h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.settings-hero p {
  max-width: 560px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.settings-login-required {
  padding: 20px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.4);
  color: var(--color-text-muted);
}

.settings-form-wrap {
  max-width: 480px;
}

.settings-form {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section h3 {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 6px 0;
}

.form-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0 0 14px 0;
}

.key-saved .key-value {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
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
  gap: 4px;
  margin-bottom: 12px;
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
  padding: 8px 10px;
  color: var(--color-text);
  font-size: 0.85rem;
}

.field small {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.form-actions {
  margin-top: 8px;
}

.btn.primary {
  padding: 8px 16px;
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
}

.btn.primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-message {
  font-size: 0.82rem;
  margin: 0;
  color: var(--color-success);
}

.form-message.error {
  color: var(--color-error);
}
</style>
