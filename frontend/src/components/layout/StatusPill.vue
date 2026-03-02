<template>
  <div class="status-pill" :class="statusClass">
    <span class="status-dot" aria-hidden="true"></span>
    <span class="status-text">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: { type: String, default: 'checking' },
  label: { type: String, default: 'Connecting…' },
});

const statusClass = computed(() => {
  const s = (props.status || 'checking').toLowerCase();
  if (['ok', 'error', 'warning', 'checking'].includes(s)) return s;
  return 'checking';
});
</script>

<style scoped>
.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.status-pill.ok {
  color: var(--color-success);
}
.status-pill.ok .status-dot {
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}
.status-pill.error {
  color: var(--color-error);
}
.status-pill.error .status-dot {
  background: var(--color-error);
}
.status-pill.warning {
  color: var(--color-warning);
}
.status-pill.warning .status-dot {
  background: var(--color-warning);
}
.status-pill.checking {
  color: var(--color-text-muted);
}
.status-pill.checking .status-dot {
  background: var(--color-text-muted);
}
</style>
