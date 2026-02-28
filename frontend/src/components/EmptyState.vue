<template>
  <div class="empty-state">
    <div class="empty-orb">✦</div>
    <h2>How can I help you today?</h2>
    <p>I can delegate tasks to specialized agents. Try one of these:</p>
    <div class="suggestion-grid">
      <button
        v-for="s in suggestions"
        :key="s.text"
        class="suggestion-chip"
        @click="$emit('suggestion', s.text)"
      >
        <span class="suggestion-icon">{{ s.icon }}</span>
        <span>{{ s.text }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
const suggestions = [
  { icon: '📬', text: 'Read my unread emails' },
  { icon: '📅', text: "What's on my calendar today?" },
  { icon: '✅', text: "Show my tasks" },
  { icon: '📰', text: "What's the latest news?" },
  { icon: '🔍', text: 'Search for node.js tutorials' },
  { icon: '🤖', text: 'What can you help me with?' },
];

defineEmits(['suggestion']);
</script>

<style scoped>
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 40px 20px;
}

.empty-orb {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  box-shadow: 0 0 40px var(--color-primary-glow);
  margin-bottom: 8px;
  animation: float 4s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}

.empty-state h2 { font-size: 1.4rem; font-weight: 700; color: var(--color-text); }
.empty-state p  { color: var(--color-text-muted); font-size: 0.9rem; }

.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  max-width: 640px;
  width: 100%;
  margin-top: 8px;
}

.suggestion-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}
.suggestion-chip:hover {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.15);
}
.suggestion-icon { font-size: 1.1rem; }
</style>
