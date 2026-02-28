<template>
  <header class="chat-header glass">
    <div class="header-left">
      <div class="logo-orb">
        <span>✦</span>
      </div>
      <div class="header-titles">
        <h1 class="header-title">AI Agent Hub</h1>
        <p class="header-subtitle">Multi-Agent Orchestrator</p>
      </div>
    </div>
    <div class="header-right">
      <button
        v-if="!me"
        class="btn-login"
        @click="$emit('login')"
        title="Sign in with Google"
      >
        Login
      </button>
      <div v-else class="user-pill" title="Signed in">
        <span class="user-email">{{ me.email }}</span>
        <button class="btn-logout" @click="$emit('logout')" title="Logout">Logout</button>
      </div>
      <button
        v-if="me"
        class="btn-history"
        @click="$emit('toggle-history')"
        title="View chat history"
      >
        History
      </button>
      <div class="status-pill" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusLabel }}</span>
      </div>
      <button class="btn-clear" @click="$emit('clear')" title="Clear conversation">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
        </svg>
        Clear
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  me: { type: Object, default: null },
  statusClass: { type: String, default: 'checking' },
  statusLabel: { type: String, default: 'Connecting…' },
});

defineEmits(['login', 'logout', 'toggle-history', 'clear']);
</script>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  z-index: 10;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-orb {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  box-shadow: 0 0 20px var(--color-primary-glow);
  animation: pulse-glow 3s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px var(--color-primary-glow); }
  50%       { box-shadow: 0 0 35px var(--color-primary-glow); }
}

.header-title {
  font-size: 1.05rem;
  font-weight: 700;
  background: linear-gradient(135deg, #e2e8f0, var(--color-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-subtitle {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.status-pill.ok    { color: var(--color-success); }
.status-pill.ok .status-dot  { background: var(--color-success); box-shadow: 0 0 6px var(--color-success); animation: blink 2s infinite; }
.status-pill.error { color: var(--color-error); }
.status-pill.error .status-dot { background: var(--color-error); }
.status-pill.warning { color: var(--color-warning); }
.status-pill.warning .status-dot { background: var(--color-warning); }
.status-pill.checking { color: var(--color-text-muted); }
.status-pill.checking .status-dot { background: var(--color-text-muted); }
@keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

.btn-clear {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.18);
  color: var(--color-error);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.btn-clear:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.35);
}

.btn-login {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.22);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}
.btn-login:hover {
  background: rgba(99, 102, 241, 0.18);
  border-color: rgba(99, 102, 241, 0.35);
}

.btn-history {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}
.btn-history:hover {
  background: rgba(148, 163, 184, 0.14);
  border-color: rgba(148, 163, 184, 0.28);
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 99px;
  border: 1px solid var(--color-border);
  background: rgba(15, 23, 42, 0.35);
}
.user-email {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-logout {
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  opacity: 0.85;
}
.btn-logout:hover { opacity: 1; }
</style>
