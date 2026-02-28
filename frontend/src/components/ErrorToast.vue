<template>
  <Transition name="toast">
    <div v-if="modelValue" class="error-toast">
      <span>⚠️</span>
      <span>{{ modelValue }}</span>
      <button @click="$emit('update:modelValue', null)">✕</button>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: null },
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.error-toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: 0.85rem;
  backdrop-filter: blur(12px);
  z-index: 100;
  max-width: 90vw;
}
.error-toast button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.7;
}
.error-toast button:hover { opacity: 1; }

.toast-enter-active,
.toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>
