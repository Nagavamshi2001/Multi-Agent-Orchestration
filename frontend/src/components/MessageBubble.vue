<template>
  <div class="message-bubble" :class="[message.role]">
    <div class="message-avatar">
      <div v-if="message.role === 'assistant'" class="agent-avatar">
        <AvatarIcon :type="agentType" />
      </div>
      <div v-else class="user-avatar">
        <AvatarIcon type="user" />
      </div>
    </div>
    
    <div class="message-body">
      <div class="message-header">
        <span class="message-author">{{ message.role === 'assistant' ? (message.agentName || 'Orchestrator') : 'You' }}</span>
        <span class="message-time">{{ formattedTime }}</span>
      </div>

      <ExecutionTrace 
        v-if="message.role === 'assistant' && (isLoading || (message.traces && message.traces.length))"
        :traces="message.traces" 
        :is-loading="isLoading" 
        :agent-name="message.agentName || 'Orchestrator'"
      />

      <Transition name="expand">
        <div v-if="!isLoading && message.role === 'assistant'" class="reveal-container">
          <div class="bubble-content" v-html="formattedContent"></div>
          <YouTubeVideoList
            v-if="message.videos && message.videos.length"
            :videos="message.videos"
            :auto-play-first="!!message.autoPlayFirst"
          />
          <GoogleResourceList
            v-if="message.docs && message.docs.length"
            :items="message.docs"
            resource-type="doc"
          />
          <GoogleResourceList
            v-if="message.sheets && message.sheets.length"
            :items="message.sheets"
            resource-type="sheet"
          />
        </div>
      </Transition>

      <div v-if="message.role === 'user'" class="bubble-content user-content">
        {{ message.content }}
      </div>

      <div class="bubble-meta" v-if="message.role === 'assistant'">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import FeedbackControls from './FeedbackControls.vue';
import YouTubeVideoList from './YouTubeVideoList.vue';
import GoogleResourceList from './GoogleResourceList.vue';
import ExecutionTrace from './ExecutionTrace.vue';
import AvatarIcon from './AvatarIcon.vue';
import { formatMessageTime, formatMarkdown } from '../utils/formatUtils.js';
import { getAgentType } from '../utils/agentDisplay.js';

const props = defineProps({
  message: { type: Object, required: true },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits(['feedback']);

const agentType = computed(() => getAgentType(props.message.agentName, props.message));

const formattedTime = computed(() => formatMessageTime(props.message.timestamp));

const formattedContent = computed(() => formatMarkdown(props.message.content || ''));

function handleFeedback(payload) {
  emit('feedback', { id: props.message.id, ...payload });
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  animation: slideIn 0.25s ease;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  transition: background-color 0.2s ease;
}
.message-bubble:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.agent-avatar {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: 100%;
  height: 100%;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  width: 100%;
  height: 100%;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.message-author {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.message-time {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.reveal-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
}

.bubble-content {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text);
  word-break: break-word;
}

.user-content {
  white-space: pre-wrap;
}

/* Enhanced Markdown Styling */
.bubble-content :deep(.md-h1),
.bubble-content :deep(.md-h2),
.bubble-content :deep(.md-h3) {
  color: var(--color-text);
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.bubble-content :deep(.md-p) {
  margin-bottom: 1em;
}

.bubble-content :deep(.md-ul),
.bubble-content :deep(.md-ol) {
  margin-bottom: 1em;
  padding-left: 20px;
}

.bubble-content :deep(.md-li) {
  margin-bottom: 4px;
}

.bubble-content :deep(.md-code-block) {
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin: 12px 0;
  overflow-x: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85em;
  line-height: 1.5;
}

.bubble-content :deep(.inline-code) {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  color: var(--color-text);
}

.bubble-content :deep(.md-blockquote) {
  border-left: 3px solid var(--color-border);
  padding-left: 12px;
  color: var(--color-text-muted);
  margin: 12px 0;
  font-style: italic;
}

.bubble-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.latency-pill {
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--color-surface-2);
  color: var(--color-text-muted);
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
