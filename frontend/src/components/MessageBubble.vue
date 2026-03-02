<template>
  <div class="message-bubble" :class="[message.role, { 'with-agent': message.agentName }]">
    <!-- Agent badge -->
    <div v-if="message.role === 'assistant'" class="agent-badge">
      <span class="agent-icon">{{ agentIcon }}</span>
      <span class="agent-name">{{ message.agentName || 'Orchestrator' }}</span>
    </div>

    <!-- User label -->
    <div v-else class="user-label">
      <span class="user-icon">👤</span>
      <span>You</span>
    </div>

    <!-- Phase 1: Thinking (Only while loading) -->
    <Transition name="fade">
      <div v-if="isLoading && message.role === 'assistant'" class="active-thinking">
        <span class="thinking-dot"></span>
        <span v-if="activeThought" class="thinking-text">
          <span class="agent-name-tag">{{ activeThought.agentName }}:</span>
          {{ activeThought.message }}
        </span>
        <span v-else class="thinking-text">
          <span class="agent-name-tag">{{ message.agentName || 'Orchestrator' }}:</span>
          Analyzing your request...
        </span>
      </div>
    </Transition>

    <!-- Phase 2: Reveal (When not loading) -->
    <Transition name="expand">
      <div v-if="!isLoading && message.role === 'assistant'" class="reveal-container">
        <!-- Message content -->
        <div class="bubble-content" v-html="formattedContent"></div>

        <!-- Execution Flow (Traces) -->
        <div v-if="flowTraces.length" class="thinking-process activity-log">
          <div class="trace-header" :class="{ expanded: isTraceExpanded }" @click="isTraceExpanded = !isTraceExpanded">
            <span class="trace-toggle-icon">{{ isTraceExpanded ? '▼' : '▶' }}</span>
            <span class="trace-title">Execution Flow</span>
            <span class="trace-count">({{ flowTraces.length }} steps)</span>
          </div>
          
          <Transition name="expand">
            <div v-if="isTraceExpanded" class="trace-list">
              <div v-for="trace in flowTraces" :key="trace.id" class="trace-item" :class="trace.step">
                <span class="trace-icon">{{ getTraceIcon(trace.step) }}</span>
                <span class="trace-text">{{ trace.message }}</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- User Message Content (Always show) -->
    <div v-if="message.role === 'user'" class="bubble-content">
      {{ message.content }}
    </div>

    <!-- Timestamp + Metrics / Feedback -->
    <div class="bubble-meta">
      <span class="bubble-time">{{ formattedTime }}</span>
      <template v-if="message.role === 'assistant'">
        <span
          v-if="typeof message.latencyMs === 'number' && message.latencyMs !== null"
          class="latency-pill"
        >
          {{ Math.round(message.latencyMs) }} ms
        </span>
        <FeedbackControls
          :user-feedback="message.userFeedback"
          :feedback-saved="message.feedbackSaved"
          @feedback="handleFeedback"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import FeedbackControls from './FeedbackControls.vue';

const props = defineProps({
  message: { type: Object, required: true },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits(['feedback']);

const isTraceExpanded = ref(false);

const thoughts = computed(() => props.message.traces?.filter(t => t.step === 'reasoning') || []);
const flowTraces = computed(() => props.message.traces?.filter(t => t.step !== 'reasoning') || []);

const activeThought = computed(() => {
  if (!props.message.traces?.length) return null;
  return props.message.traces[props.message.traces.length - 1];
});

const getTraceIcon = (step) => {
  if (step === 'handoff_init') return '🧠';
  if (step === 'handoff') return '🔄';
  if (step === 'tool_start') return '⚙️';
  if (step === 'tool_end') return '✅';
  if (step === 'reasoning') return '⚡';
  return '•';
};

const agentIcon = computed(() => {
  const name = (props.message.agentName || '').toLowerCase();
  if (name.includes('email')) return '📧';
  if (name.includes('calendar')) return '📅';
  return '🤖';
});

const formattedTime = computed(() => {
  return new Date(props.message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
});

// Simple markdown-like formatter
const formattedContent = computed(() => {
  let text = props.message.content || '';

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  // Headers
  text = text.replace(/^### (.*$)/gm, '<h3 class="md-h3">$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2 class="md-h2">$1</h2>');
  // Numbered list items
  text = text.replace(/^\d+\. (.*$)/gm, '<li class="md-li ordered">$1</li>');
  // Bullet points
  text = text.replace(/^[-*•] (.*$)/gm, '<li class="md-li">$1</li>');
  // Line breaks
  text = text.replace(/\n/g, '<br>');

  return text;
});

const handleFeedback = (payload) => {
  emit('feedback', { id: props.message.id, ...payload });
};
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

.thinking-process.activity-log {
  margin-top: 8px;
  background: rgba(15, 23, 42, 0.2);
  backdrop-filter: none;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  box-shadow: none;
}

.reveal-container {
  display: flex;
  flex-direction: column;
  width: 100%;
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

@keyframes sparkle {
  0%, 100% { opacity: 0.5; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
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

/* Pulse animation for the MOST RECENT trace */
.trace-item:last-child {
  color: var(--color-text);
  animation: slideInTrace 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.trace-item:last-child .trace-text {
  background: linear-gradient(90deg, #fff, rgba(255,255,255,0.7));
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

/* expand transition */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 400px;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

/* fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.message-bubble {
  display: flex;
  flex-direction: column;
  max-width: 82%;
  gap: 6px;
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* User messages — right aligned */
.message-bubble.user {
  align-self: flex-end;
  align-items: flex-end;
}

/* Assistant messages — left aligned */
.message-bubble.assistant {
  align-self: flex-start;
  align-items: flex-start;
}

/* Labels */
.agent-badge, .user-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.agent-icon, .user-icon { font-size: 0.9rem; }

/* Bubble body */
.bubble-content {
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  font-size: 0.92rem;
  line-height: 1.7;
  word-break: break-word;
}

.bubble-content.placeholder {
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 0.85rem;
  opacity: 0.6;
}

.user .bubble-content {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 20px var(--color-primary-glow);
}

.assistant .bubble-content {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

/* Markdown styles inside bubbles */
.bubble-content :deep(.md-h2) {
  font-size: 1rem;
  font-weight: 700;
  margin: 10px 0 4px;
  color: var(--color-accent);
}
.bubble-content :deep(.md-h3) {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 8px 0 4px;
  color: var(--color-primary);
}
.bubble-content :deep(.md-li) {
  display: list-item;
  margin-left: 18px;
  margin-bottom: 3px;
}
.bubble-content :deep(.inline-code) {
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 4px;
  padding: 1px 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  color: var(--color-accent);
}

/* Timestamp */
.bubble-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.68rem;
  color: var(--color-text-muted);
  opacity: 0.8;
  padding: 0 4px;
}

.bubble-time {
  white-space: nowrap;
}

.latency-pill {
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.6);
  font-size: 0.65rem;
}

</style>
