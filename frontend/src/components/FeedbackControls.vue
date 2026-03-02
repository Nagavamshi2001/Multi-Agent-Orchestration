<template>
  <div class="feedback-group">
    <button
      class="feedback-btn"
      :class="{ active: userFeedback === 'up' }"
      type="button"
      @click="handleThumbUp"
    >
      👍
    </button>
    <button
      class="feedback-btn"
      :class="{ active: userFeedback === 'down' }"
      type="button"
      @click="handleThumbDown"
    >
      👎
    </button>
    <span v-if="feedbackSaved" class="feedback-status">
      Thanks for your feedback
    </span>
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
.feedback-group {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.feedback-btn {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.8rem;
  opacity: 0.6;
  padding: 0 2px;
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.feedback-btn:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.feedback-btn.active {
  opacity: 1;
}

.feedback-status {
  font-size: 0.7rem;
  opacity: 0.75;
}
</style>

