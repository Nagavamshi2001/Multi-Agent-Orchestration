<template>
  <div v-if="modelValue" class="login-modal-backdrop">
    <div class="login-modal">
      <h2 class="login-modal-title">Sign in to continue</h2>
      <p class="login-modal-text">
        To get the most out of AI Agent Hub (like email and calendar tools), please sign in with your Google account.
      </p>
      <div class="login-modal-actions">
        <button class="login-modal-primary" @click="$emit('login')">
          Continue with Google
        </button>
        <button class="login-modal-secondary" @click="$emit('update:modelValue', false)">
          Maybe later
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
});

defineEmits(['update:modelValue', 'login']);
</script>

<style scoped>
.login-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.login-modal {
  width: 100%;
  max-width: 360px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 20px 22px 18px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.55);
  border: 1px solid var(--color-border);
}

.login-modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--color-text);
}

.login-modal-text {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.login-modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.login-modal-primary {
  padding: 7px 14px;
  border-radius: var(--radius-md);
  border: none;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 18px var(--color-primary-glow);
  transition: var(--transition);
}
.login-modal-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px var(--color-primary-glow);
}

.login-modal-secondary {
  padding: 7px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}
.login-modal-secondary:hover {
  background: rgba(148, 163, 184, 0.08);
}
</style>
