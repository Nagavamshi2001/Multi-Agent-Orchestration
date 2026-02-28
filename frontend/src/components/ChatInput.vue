<template>
  <footer class="input-area glass">
    <div class="input-wrapper">
      <textarea
        ref="inputRef"
        :value="modelValue"
        class="chat-input"
        placeholder="Ask me anything — I'll delegate to the right agent…"
        :disabled="disabled"
        rows="1"
        @input="(e) => { onInput(e); $emit('update:modelValue', e.target.value); }"
        @keydown.enter.exact.prevent="$emit('send')"
      ></textarea>
      <button
        class="send-btn"
        :class="{ active: modelValue.trim().length > 0 && !disabled }"
        :disabled="!modelValue.trim() || disabled"
        @click="$emit('send')"
      >
        <svg v-if="!disabled" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
        <svg v-else class="spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
        </svg>
      </button>
    </div>
    <p class="input-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line</p>
  </footer>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
});

defineEmits(['update:modelValue', 'send']);

const inputRef = ref(null);

const onInput = (e) => {
  const el = e.target;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
};

defineExpose({ inputRef });
</script>

<style scoped>
.input-area {
  padding: 16px 24px 20px;
  z-index: 10;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 10px 10px 10px 18px;
  transition: var(--transition);
}
.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-glow);
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 0.95rem;
  font-family: var(--font-sans);
  line-height: 1.5;
  resize: none;
  min-height: 24px;
  max-height: 160px;
}
.chat-input::placeholder { color: var(--color-text-muted); }
.chat-input:disabled { opacity: 0.6; cursor: not-allowed; }

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: var(--transition);
}
.send-btn.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-color: transparent;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 15px var(--color-primary-glow);
}
.send-btn.active:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px var(--color-primary-glow);
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.input-hint {
  margin-top: 8px;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-align: center;
  opacity: 0.7;
}
.input-hint kbd {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.65rem;
  font-family: monospace;
}
</style>
