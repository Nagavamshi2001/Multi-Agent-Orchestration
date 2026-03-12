<template>
  <div v-if="isLoading || traces.length" class="thought-process">
    <div
      class="trace-header"
      :class="{ expanded: isExpanded, 'is-loading': isLoading }"
      @click="isExpanded = !isExpanded"
    >
      <!-- Left side: Status Icon -->
      <span class="status-icon">
        <svg v-if="isLoading" class="loader-spinner" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <svg v-else class="check-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>

      <!-- Title -->
      <span class="trace-title">
        {{ isLoading ? 'Thinking...' : 'Thought process' }}
      </span>

      <!-- Right side: Chevron -->
      <span class="trace-toggle-icon">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </div>

    <Transition name="expand">
      <div v-if="isExpanded" class="trace-content">
        <div class="trace-timeline">
          <div
            v-for="(trace, index) in traces"
            :key="trace.id"
            class="trace-item"
            :class="[trace.step, { 'latest': index === traces.length - 1 && isLoading }]"
          >
            <div class="trace-marker">
              <span class="trace-icon">{{ getTraceIcon(trace.step) }}</span>
            </div>
            <div class="trace-text-wrapper">
              <span class="trace-text">{{ trace.message }}</span>
            </div>
          </div>
          
          <div v-if="isLoading" class="trace-item loading-indicator">
            <div class="trace-marker">
              <div class="pulsing-dot"></div>
            </div>
            <div class="trace-text-wrapper">
              <span class="trace-text typing">Working on it...</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getTraceIcon } from '../utils/agentDisplay.js';

const props = defineProps({
  traces: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  agentName: { type: String, default: 'Agent' }
});

const isExpanded = ref(props.isLoading);

watch(() => props.isLoading, (loading) => {
  if (loading) {
    isExpanded.value = true;
  } else {
    // Auto-collapse when done
    isExpanded.value = false;
  }
});
</script>

<style scoped>
.thought-process {
  margin-bottom: 12px;
  width: 100%;
}

.trace-header {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.trace-header:hover {
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text);
  border-color: var(--color-border);
}

.trace-header.is-loading {
  color: var(--color-text);
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-spinner {
  animation: spin 1.5s linear infinite;
  color: var(--color-text-muted);
}

.check-icon {
  color: #10b981; /* Success green */
}

.trace-toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.5;
}

.trace-header.expanded .trace-toggle-icon {
  transform: rotate(180deg);
}

.trace-content {
  margin-top: 4px;
  padding: 12px 16px 8px 16px;
  border-left: 2px solid rgba(255, 255, 255, 0.05);
  margin-left: 14px; /* align with header center */
  display: flex;
  flex-direction: column;
}

.trace-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trace-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  position: relative;
}

.trace-marker {
  flex-shrink: 0;
  width: 16px;
  display: flex;
  justify-content: center;
  margin-top: 2px;
  font-size: 0.85rem;
}

.trace-text-wrapper {
  flex: 1;
  word-break: break-word;
}

.trace-item.latest .trace-text-wrapper {
  color: var(--color-text);
}

.trace-item.reasoning .trace-text-wrapper {
  opacity: 0.8;
}

.pulsing-dot {
  width: 6px;
  height: 6px;
  background: var(--color-text-muted);
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite;
  margin-top: 4px;
}

.typing {
  opacity: 0.6;
  font-style: italic;
  animation: pulse-text 1.5s infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

@keyframes pulse-dot {
  0% { transform: scale(0.8); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 0.8; box-shadow: 0 0 6px rgba(255, 255, 255, 0.3); }
  100% { transform: scale(0.8); opacity: 0.3; }
}

@keyframes pulse-text {
  0% { opacity: 0.3; }
  50% { opacity: 0.7; }
  100% { opacity: 0.3; }
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 2000px;
  opacity: 1;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}
</style>
