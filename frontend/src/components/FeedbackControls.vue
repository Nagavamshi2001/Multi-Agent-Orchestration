<template>
  <div class="feedback-container">
    <Transition name="fade-switch" mode="out-in">
      <div class="feedback-group" v-if="!feedbackSaved">
        <button
          class="feedback-btn"
          :class="{ active: userFeedback === 'up' }"
          type="button"
          title="Good response"
          @click="handleThumbUp"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feedback-icon">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
          </svg>
        </button>
        <button
          class="feedback-btn"
          :class="{ active: userFeedback === 'down' }"
          type="button"
          title="Bad response"
          @click="handleThumbDown"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feedback-icon">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
          </svg>
        </button>
      </div>
      <div v-else class="feedback-status">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="status-icon">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Feedback submitted</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  userFeedback: { type: String, default: null }, // 'up' | 'down' | null
  feedbackSaved: { type: Boolean, default: false },
});

const emit = defineEmits(['feedback']);

const handleThumbUp = () => {
  emit('feedback', { rating: 5, helpful: true });
};

const handleThumbDown = () => {
  emit('feedback', { rating: 1, helpful: false });
};
</script>

<style scoped>
.feedback-container {
  display: flex;
  align-items: center;
  min-height: 26px;
  margin-left: auto;
}

.feedback-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.feedback-btn {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.feedback-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.feedback-btn:hover {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.05);
}

.feedback-btn:hover .feedback-icon {
  transform: scale(1.1);
}

.feedback-btn:active .feedback-icon {
  transform: scale(0.9);
}

.feedback-btn.active {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.1);
}

.feedback-btn.active .feedback-icon {
  fill: currentColor;
}

.feedback-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  color: #10b981; /* Success green */
  background: rgba(16, 185, 129, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-icon {
  width: 12px;
  height: 12px;
}

.fade-switch-enter-active,
.fade-switch-leave-active {
  transition: all 0.2s ease;
}
.fade-switch-enter-from {
  opacity: 0;
  transform: translateX(5px);
}
.fade-switch-leave-to {
  opacity: 0;
  transform: translateX(-5px);
}
</style>
