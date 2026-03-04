<template>
  <div class="active-thinking">
    <span class="thinking-dot" aria-hidden="true"></span>
    <span class="thinking-text">
      <span class="agent-name-tag">{{ (thought && thought.agentName) || agentName }}:</span>
      {{ thought ? thought.message : fallbackText }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  thought: { type: Object, default: null },
  fallbackText: { type: String, default: 'Analyzing your request...' },
  agentName: { type: String, default: 'Orchestrator' },
});
</script>

<style scoped>
.active-thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  font-size: 0.78rem;
  color: var(--color-accent);
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 99px;
  margin-bottom: 8px;
  animation: fadeIn 0.3s ease;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.1);
}

.agent-name-tag {
  font-weight: 700;
  margin-right: 4px;
  opacity: 0.9;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
}

.thinking-dot {
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 8px var(--color-accent); }
  100% { transform: scale(0.9); opacity: 0.6; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
