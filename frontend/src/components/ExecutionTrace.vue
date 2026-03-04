<template>
  <div v-if="traces.length" class="thinking-process activity-log">
    <div
      class="trace-header"
      :class="{ expanded: isExpanded }"
      @click="isExpanded = !isExpanded"
    >
      <span class="trace-toggle-icon">{{ isExpanded ? '▼' : '▶' }}</span>
      <span class="trace-title">Execution Flow</span>
      <span class="trace-count">({{ traces.length }} steps)</span>
    </div>
    <Transition name="expand">
      <div v-if="isExpanded" class="trace-list">
        <div
          v-for="trace in traces"
          :key="trace.id"
          class="trace-item"
          :class="trace.step"
        >
          <span class="trace-icon">{{ getTraceIcon(trace.step) }}</span>
          <span class="trace-text">{{ trace.message }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getTraceIcon } from '../utils/agentDisplay.js';

defineProps({
  traces: { type: Array, default: () => [] },
});

const isExpanded = ref(false);
</script>

<style scoped>
.thinking-process.activity-log {
  margin-top: 8px;
  background: rgba(15, 23, 42, 0.2);
  backdrop-filter: none;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  box-shadow: none;
}

.trace-header {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  user-select: none;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
}

.trace-header:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text);
}

.trace-toggle-icon {
  font-size: 0.6rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.trace-header.expanded .trace-toggle-icon {
  transform: rotate(90deg);
}

.trace-title {
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.02em;
}

.trace-title::before {
  content: '📋';
  font-size: 0.8rem;
}

.trace-count {
  margin-left: auto;
  font-size: 0.65rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 6px;
  border-radius: 4px;
  opacity: 0.6;
}

.trace-list {
  padding: 4px 0 12px;
  display: flex;
  flex-direction: column;
}

.trace-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 14px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  transition: all 0.3s ease;
  position: relative;
}

.trace-item::before {
  content: '';
  position: absolute;
  left: 19px;
  top: 24px;
  bottom: -6px;
  width: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.trace-item:last-child::before {
  display: none;
}

.trace-icon {
  font-size: 0.9rem;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  background: var(--color-bg);
}

.trace-text {
  line-height: 1.5;
  word-break: break-word;
}

.trace-item:last-child {
  color: var(--color-text);
  animation: slideInTrace 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.trace-item:last-child .trace-text {
  background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.7));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 500;
}

@keyframes slideInTrace {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.trace-item.tool_start .trace-icon { color: var(--color-accent); }
.trace-item.handoff .trace-icon { color: var(--color-primary); }
.trace-item.handoff_init .trace-icon { color: #f59e0b; }
.trace-item.reasoning .trace-icon { color: #ec4899; }
.trace-item.tool_end { opacity: 0.5; font-size: 0.75rem; padding-top: 2px; padding-bottom: 2px; }

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 400px;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>
