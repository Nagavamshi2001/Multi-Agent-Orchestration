<template>
  <div class="chat-interface">
    <!-- Header -->
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
        <!-- Status indicator -->
        <div class="status-pill" :class="statusClass">
          <span class="status-dot"></span>
          <span class="status-text">{{ statusLabel }}</span>
        </div>
        <!-- Active agents display -->
        <div class="agents-info">
          <span class="agent-chip" title="Orchestrator">🤖 Orchestrator</span>
          <span class="agent-chip email" title="Email Assistant">📧 Email</span>
        </div>
        <!-- Clear button -->
        <button class="btn-clear" @click="clearChat" title="Clear conversation">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
          </svg>
          Clear
        </button>
      </div>
    </header>

    <!-- Messages area -->
    <main class="messages-area" ref="messagesEnd">
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-orb">✦</div>
        <h2>How can I help you today?</h2>
        <p>I can delegate tasks to specialized agents. Try one of these:</p>
        <div class="suggestion-grid">
          <button
            v-for="s in suggestions"
            :key="s.text"
            class="suggestion-chip"
            @click="useSuggestion(s.text)"
          >
            <span class="suggestion-icon">{{ s.icon }}</span>
            <span>{{ s.text }}</span>
          </button>
        </div>
      </div>

      <!-- Message bubbles -->
      <div class="messages-list" v-else>
        <MessageBubble
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
          :is-loading="isLoading && msg === messages[messages.length - 1]"
        />
      </div>
    </main>

    <!-- Input area -->
    <footer class="input-area glass">
      <div class="input-wrapper">
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="chat-input"
          placeholder="Ask me anything — I'll delegate to the right agent…"
          :disabled="isLoading"
          rows="1"
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
        ></textarea>
        <button
          class="send-btn"
          :class="{ active: inputText.trim().length > 0 && !isLoading }"
          :disabled="!inputText.trim() || isLoading"
          @click="sendMessage"
        >
          <svg v-if="!isLoading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
          <svg v-else class="spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
          </svg>
        </button>
      </div>
      <p class="input-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line</p>
    </footer>

    <!-- Error toast -->
    <Transition name="toast">
      <div v-if="error" class="error-toast">
        <span>⚠️</span>
        <span>{{ error }}</span>
        <button @click="error = null">✕</button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue';
import MessageBubble from './MessageBubble.vue';
import { sendMessage as apiSendMessage, checkHealth, clearSession } from '../services/api.js';

// ─── State ────────────────────────────────────────────────────────────────────
const messages = ref([]);
const inputText = ref('');
const isLoading = ref(false);
const error = ref(null);
const messagesEnd = ref(null);
const inputRef = ref(null);
const sessionId = ref(`session_${Date.now()}`);
const backendStatus = ref('checking'); // 'ok' | 'error' | 'checking'
const socket = ref(null);

// ─── Quick suggestions (one per agent) ─────────────────────────────────────────
const suggestions = [
  { icon: '📬', text: 'Read my unread emails' },
  { icon: '📅', text: "What's on my calendar today?" },
  { icon: '✅', text: "Show my tasks" },
  { icon: '📰', text: "What's the latest news?" },
  { icon: '🔍', text: 'Search for node.js tutorials' },
  { icon: '🤖', text: 'What can you help me with?' },
];

// ─── Status display ───────────────────────────────────────────────────────────
const statusClass = ref('checking');
const statusLabel = ref('Connecting…');

const updateStatus = (health) => {
  if (health.openaiConfigured) {
    statusClass.value = 'ok';
    statusLabel.value = 'Online';
  } else {
    statusClass.value = 'warning';
    statusLabel.value = 'Config needed';
  }
};

// ─── WebSocket Connection ─────────────────────────────────────────────────────
const connectWebSocket = () => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
    socket.value = new WebSocket(wsUrl);

    socket.value.onopen = () => {
        console.log('[WebSocket] Connected');
        statusClass.value = 'ok';
        statusLabel.value = 'Online';
    };

    socket.value.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Message:', data);

        if (data.type === 'trace') {
            // Find the last assistant message and add the trace
            const lastMsg = [...messages.value].reverse().find(m => m.role === 'assistant');
            if (lastMsg) {
                if (!lastMsg.traces) lastMsg.traces = [];
                lastMsg.traces.push({
                    id: Date.now(),
                    message: data.message,
                    agentName: data.agentName,
                    step: data.step
                });
            }
        } else if (data.type === 'response') {
            // Final response received
            const lastMsg = [...messages.value].reverse().find(m => m.role === 'assistant');
            if (lastMsg) {
                lastMsg.content = data.reply;
                lastMsg.agentName = data.agentName;
            }
            isLoading.value = false;
            scrollToBottom();
        } else if (data.type === 'error') {
            error.value = data.message;
            isLoading.value = false;
        }
    };

    socket.value.onclose = () => {
        console.log('[WebSocket] Disconnected');
        statusClass.value = 'error';
        statusLabel.value = 'Offline';
        // Auto-reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };
};

// ─── Helper: scroll to bottom ────────────────────────────────────────────────
const scrollToBottom = async () => {
  await nextTick();
  if (messagesEnd.value) {
    messagesEnd.value.scrollTo({ top: messagesEnd.value.scrollHeight, behavior: 'smooth' });
  }
};

// ─── Helper: add message ─────────────────────────────────────────────────────
const addMessage = (role, content, agentName = null) => {
  const msg = {
    id: `${role}_${Date.now()}_${Math.random()}`,
    role,
    content,
    agentName,
    timestamp: new Date().toISOString(),
    traces: []
  };
  messages.value.push(msg);
  return msg;
};

// ─── Send message ─────────────────────────────────────────────────────────────
const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  inputText.value = '';
  autoResize();
  error.value = null;

  addMessage('user', text);
  await scrollToBottom();

  isLoading.value = true;
  
  // Add a placeholder assistant message that will be filled by traces and the final response
  addMessage('assistant', '', 'Orchestrator');

  if (socket.value && socket.value.readyState === WebSocket.OPEN) {
    socket.value.send(JSON.stringify({
      message: text,
      sessionId: sessionId.value
    }));
  } else {
    error.value = 'Connection lost. Trying to reconnect...';
    isLoading.value = false;
  }
};

// ─── Use suggestion ───────────────────────────────────────────────────────────
const useSuggestion = (text) => {
  inputText.value = text;
  sendMessage();
};

// ─── Clear chat ───────────────────────────────────────────────────────────────
const clearChat = async () => {
  messages.value = [];
  error.value = null;
  try {
    await clearSession(sessionId.value);
  } catch (_) { /* ignore */ }
  sessionId.value = `session_${Date.now()}`;
};

// ─── Auto-resize textarea ─────────────────────────────────────────────────────
const autoResize = () => {
  const el = inputRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
};

// ─── Mount ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  connectWebSocket();
  try {
    const health = await checkHealth();
    updateStatus(health);
    backendStatus.value = 'ok';
  } catch {
    statusClass.value = 'error';
    statusLabel.value = 'Backend offline';
    backendStatus.value = 'error';
  }
  inputRef.value?.focus();
});
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
  position: relative;
  overflow: hidden;
}

/* Ambient background blobs */
.chat-interface::before {
  content: '';
  position: fixed;
  top: -20%;
  left: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
.chat-interface::after {
  content: '';
  position: fixed;
  bottom: -10%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ─── Header ───────────────────────────────────────────────────────────────── */
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

/* Status pill */
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

/* Agent chips */
.agents-info { display: flex; gap: 6px; }
.agent-chip {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: var(--color-primary);
}
.agent-chip.email {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.2);
  color: var(--color-accent);
}

/* Clear button */
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

/* ─── Messages Area ─────────────────────────────────────────────────────────── */
.messages-area {
  flex: 1;
  min-height: 0;        /* critical: allows flex child to shrink and scroll */
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* removed min-height:100% — it prevented the parent from scrolling */
  padding-bottom: 8px;
}

/* Empty state */
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

/* Typing indicator */
.typing-indicator {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.agent-badge-small {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  border-bottom-left-radius: 4px;
}
.typing-bubble span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: bounce 1.2s infinite ease-in-out;
}
.typing-bubble span:nth-child(2) { animation-delay: 0.15s; }
.typing-bubble span:nth-child(3) { animation-delay: 0.3s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
  40%           { transform: scale(1.1); opacity: 1; }
}

/* ─── Input Area ────────────────────────────────────────────────────────────── */
.input-area {
  padding: 16px 24px 20px;
  z-index: 10;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 10px 10px 10px 18px;
  transition: var(--transition);
}
.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-glow);
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 0.95rem;
  font-family: var(--font-sans);
  line-height: 1.5;
  resize: none;
  min-height: 24px;
  max-height: 160px;
}
.chat-input::placeholder { color: var(--color-text-muted); }
.chat-input:disabled { opacity: 0.6; cursor: not-allowed; }

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: var(--transition);
}
.send-btn.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-color: transparent;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 15px var(--color-primary-glow);
}
.send-btn.active:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px var(--color-primary-glow);
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.input-hint {
  margin-top: 8px;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-align: center;
  opacity: 0.7;
}
.input-hint kbd {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.65rem;
  font-family: monospace;
}

/* ─── Error Toast ───────────────────────────────────────────────────────────── */
.error-toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: 0.85rem;
  backdrop-filter: blur(12px);
  z-index: 100;
  max-width: 90vw;
}
.error-toast button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.7;
}
.error-toast button:hover { opacity: 1; }

.toast-enter-active,
.toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>
