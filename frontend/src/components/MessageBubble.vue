<template>
  <div class="message-bubble" :class="[message.role, { 'with-agent': message.agentName }]">
    <div v-if="message.role === 'assistant'" class="agent-badge">
      <span class="agent-icon">{{ agentIcon }}</span>
      <span class="agent-name">{{ message.agentName || 'Orchestrator' }}</span>
    </div>
    <div v-else class="user-label">
      <span class="user-icon">👤</span>
      <span>You</span>
    </div>

    <Transition name="fade">
      <ThinkingIndicator
        v-if="isLoading && message.role === 'assistant'"
        :thought="activeThought"
        :agent-name="message.agentName || 'Orchestrator'"
      />
    </Transition>

    <Transition name="expand">
      <div v-if="!isLoading && message.role === 'assistant'" class="reveal-container">
        <div class="bubble-content" v-html="formattedContent"></div>
        <YouTubeVideoList
          v-if="message.videos && message.videos.length"
          :videos="message.videos"
          :auto-play-first="!!message.autoPlayFirst"
        />
        <ExecutionTrace :traces="flowTraces" />
      </div>
    </Transition>

    <div v-if="message.role === 'user'" class="bubble-content">
      {{ message.content }}
    </div>

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
import { computed } from 'vue';
import FeedbackControls from './FeedbackControls.vue';
import YouTubeVideoList from './YouTubeVideoList.vue';
import ThinkingIndicator from './ThinkingIndicator.vue';
import ExecutionTrace from './ExecutionTrace.vue';
import { formatMessageTime, formatMarkdown } from '../utils/formatUtils.js';
import { getAgentIcon } from '../utils/agentDisplay.js';

const props = defineProps({
  message: { type: Object, required: true },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits(['feedback']);

const flowTraces = computed(() =>
  props.message.traces?.filter((t) => t.step !== 'reasoning') || []
);

const activeThought = computed(() => {
  const traces = props.message.traces;
  if (!traces?.length) return null;
  return traces[traces.length - 1];
});

const agentIcon = computed(() => getAgentIcon(props.message.agentName, props.message));

const formattedTime = computed(() => formatMessageTime(props.message.timestamp));

const formattedContent = computed(() => formatMarkdown(props.message.content || ''));

function handleFeedback(payload) {
  emit('feedback', { id: props.message.id, ...payload });
}
</script>

<style scoped>
.reveal-container {
  display: flex;
  flex-direction: column;
  width: 100%;
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
  to { opacity: 1; transform: translateY(0); }
}

.message-bubble.user {
  align-self: flex-end;
  align-items: flex-end;
}

.message-bubble.assistant {
  align-self: flex-start;
  align-items: flex-start;
}

.agent-badge,
.user-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.agent-icon,
.user-icon {
  font-size: 0.9rem;
}

.bubble-content {
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  font-size: 0.92rem;
  line-height: 1.7;
  word-break: break-word;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
