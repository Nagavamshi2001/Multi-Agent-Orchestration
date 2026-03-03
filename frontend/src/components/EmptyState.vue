<template>
  <div class="empty-state">
    <div class="empty-orb" aria-hidden="true">✦</div>
    <h2 class="empty-title">How can I help you today?</h2>
    <p class="empty-subtitle">I can help with</p>
    <div class="capability-pills" role="list" aria-label="Available capabilities">
      <span
        v-for="cap in capabilities"
        :key="cap.id"
        class="capability-pill"
        role="listitem"
      >
        <span class="capability-pill-icon" aria-hidden="true">{{ cap.icon }}</span>
        <span>{{ cap.name }}</span>
      </span>
    </div>
    <div class="suggestions-section">
      <p class="suggestions-heading">Try one of these or ask anything</p>
      <div class="suggestion-grid">
        <button
          v-for="s in suggestions"
          :key="s.text"
          class="suggestion-chip"
          :class="['suggestion-chip--' + s.category]"
          :title="s.hint"
          type="button"
          @click="$emit('suggestion', s.text)"
        >
          <span class="suggestion-chip-accent" aria-hidden="true" />
          <span class="suggestion-chip-inner">
            <span class="suggestion-head">
              <span class="suggestion-icon" aria-hidden="true">{{ s.icon }}</span>
              <span class="suggestion-label">{{ s.label }}</span>
            </span>
            <span class="suggestion-text">{{ s.text }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const capabilities = [
  { id: 'email', name: 'Email', icon: '📬' },
  { id: 'calendar', name: 'Calendar', icon: '📅' },
  { id: 'tasks', name: 'Tasks', icon: '✅' },
  { id: 'news', name: 'News', icon: '📰' },
  { id: 'search', name: 'Web search', icon: '🔍' },
];

const suggestions = [
  { icon: '📬', label: 'Email', category: 'email', text: 'Read my unread emails', hint: 'Check inbox, send or search Gmail' },
  { icon: '📅', label: 'Calendar', category: 'calendar', text: "What's on my calendar today?", hint: 'List, create or edit events' },
  { icon: '✅', label: 'Tasks', category: 'tasks', text: "Show my tasks", hint: 'List, add or complete to-dos' },
  { icon: '📰', label: 'News', category: 'news', text: "What's the latest news?", hint: 'Headlines, search or news by topic' },
  { icon: '🔍', label: 'Search', category: 'search', text: 'Search the web for Node.js tutorials', hint: 'Look up anything on the web' },
  { icon: '🤖', label: 'Help', category: 'help', text: 'What can you do?', hint: 'See full list of capabilities' },
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
  gap: 0;
  padding: 32px 24px 48px;
  max-width: 680px;
  margin: 0 auto;
}

.empty-orb {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: white;
  box-shadow: 0 0 32px var(--color-primary-glow), 0 4px 24px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  animation: float 5s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  margin: 0 0 6px;
}
.empty-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0 0 12px;
}

.capability-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 28px;
}
.capability-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 500;
}
.capability-pill-icon {
  font-size: 0.95rem;
  opacity: 0.9;
}

.suggestions-section {
  width: 100%;
  text-align: left;
}
.suggestions-heading {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin: 0 0 12px;
  padding: 0 2px;
}

.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.suggestion-chip {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 0;
  padding: 0;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease;
  overflow: hidden;
}
.suggestion-chip:focus {
  outline: none;
}
.suggestion-chip:focus-visible {
  box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-primary);
}
.suggestion-chip:hover {
  border-color: rgba(99, 102, 241, 0.4);
  background: var(--color-surface-2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}
.suggestion-chip-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  background: var(--color-primary);
  opacity: 0.6;
}
.suggestion-chip--email .suggestion-chip-accent { background: #06b6d4; }
.suggestion-chip--calendar .suggestion-chip-accent { background: var(--color-secondary); }
.suggestion-chip--tasks .suggestion-chip-accent { background: var(--color-success); }
.suggestion-chip--news .suggestion-chip-accent { background: var(--color-warning); }
.suggestion-chip--search .suggestion-chip-accent { background: var(--color-accent); }
.suggestion-chip--help .suggestion-chip-accent { background: var(--color-primary); }

.suggestion-chip-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 12px 14px 12px 16px;
  width: 100%;
}
.suggestion-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.suggestion-icon {
  font-size: 1rem;
}
.suggestion-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}
.suggestion-text {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--color-text);
}
</style>
