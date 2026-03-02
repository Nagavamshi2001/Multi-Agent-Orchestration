<template>
  <div class="chat-interface">
    <ChatHeader
      :me="me"
      :status-class="statusClass"
      :status-label="statusLabel"
      @login="loginWithGoogle"
      @logout="doLogout"
      @toggle-history="toggleHistory"
      @clear="clearChat"
    />

    <main class="messages-area" ref="messagesEnd">
      <EmptyState v-if="messages.length === 0" @suggestion="useSuggestion" />
      <div v-else class="messages-list">
        <MessageBubble
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
          :is-loading="isLoading && msg === messages[messages.length - 1]"
          @feedback="handleFeedback"
        />
      </div>
    </main>

    <ChatInput
      v-model="inputText"
      :disabled="isLoading"
      @send="sendMessage"
    />

    <LoginModal v-model="showLoginModal" @login="loginWithGoogle" />

    <HistoryDrawer
      v-model="showHistory"
      :sessions="historySessions"
      :active-session-id="sessionId"
      :loading="historyLoading"
      :error="historyError"
      @open="openSession"
      @new-chat="startNewChat"
      @refresh="refreshHistory"
    />

    <ErrorToast v-model="error" />
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue';
import MessageBubble from './MessageBubble.vue';
import ChatHeader from './ChatHeader.vue';
import EmptyState from './EmptyState.vue';
import ChatInput from './ChatInput.vue';
import LoginModal from './LoginModal.vue';
import HistoryDrawer from './HistoryDrawer.vue';
import ErrorToast from './ErrorToast.vue';
import {
  checkHealth,
  clearSession,
  getMe,
  logout as apiLogout,
  API_BASE,
  listChatSessions,
  createChatSession,
  getChatSessionMessages,
  sendMetricsFeedback,
} from '../services/api.js';

// ─── State ────────────────────────────────────────────────────────────────────
const messages = ref([]);
const inputText = ref('');
const isLoading = ref(false);
const error = ref(null);
const messagesEnd = ref(null);
const sessionId = ref(localStorage.getItem('sk_session_id') || `session_${Date.now()}`);
const socket = ref(null);
const me = ref(null);
const showLoginModal = ref(false);
const showHistory = ref(false);
const historySessions = ref([]);
const historyLoading = ref(false);
const historyError = ref(null);

watch(sessionId, (v) => {
  localStorage.setItem('sk_session_id', v);
});

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
      const lastMsg = [...messages.value].reverse().find(m => m.role === 'assistant');
      if (lastMsg) {
        lastMsg.content = data.reply;
        lastMsg.agentName = data.agentName;
        const nowTs = Date.now();
        const base = lastMsg._sentAt || nowTs;
        lastMsg.latencyMs = nowTs - base;

        if (me.value) {
          sendMetricsFeedback({
            chatSessionId: data.sessionId || sessionId.value,
            latencyMs: lastMsg.latencyMs,
            rating: null,
            helpful: null,
            feedbackText: null,
          }).catch(() => {});
        }
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
    setTimeout(connectWebSocket, 3000);
  };
};

// ─── Auth actions ─────────────────────────────────────────────────────────────
const loginWithGoogle = () => {
  const returnTo = window.location.href;
  window.location.href = `${API_BASE}/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
};

const doLogout = async () => {
  try {
    await apiLogout();
  } catch (_) {}
  me.value = null;
  clearChat();
  showLoginModal.value = true;
};

const refreshHistory = async () => {
  if (!me.value) return;
  historyLoading.value = true;
  historyError.value = null;
  try {
    const res = await listChatSessions();
    historySessions.value = res.sessions || [];
  } catch (e) {
    historyError.value = e?.response?.data?.error || e?.message || 'Failed to load history';
  } finally {
    historyLoading.value = false;
  }
};

const toggleHistory = async () => {
  showHistory.value = !showHistory.value;
  if (showHistory.value) {
    await refreshHistory();
  }
};

const openSession = async (chatSessionId) => {
  if (!me.value) return;
  historyLoading.value = true;
  historyError.value = null;
  try {
    const res = await getChatSessionMessages(chatSessionId);
    const dbMessages = res.messages || [];
    messages.value = dbMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      agentName: m.agent_name || null,
      timestamp: new Date(Number(m.created_at)).toISOString(),
      traces: [],
    }));
    sessionId.value = chatSessionId;
    showHistory.value = false;
    await scrollToBottom();
  } catch (e) {
    historyError.value = e?.response?.data?.error || e?.message || 'Failed to open chat';
  } finally {
    historyLoading.value = false;
  }
};

const startNewChat = async () => {
  messages.value = [];
  error.value = null;
  if (me.value) {
    try {
      const res = await createChatSession();
      const newId = res?.session?.id;
      sessionId.value = newId || `session_${Date.now()}`;
      await refreshHistory();
      showHistory.value = false;
      return;
    } catch (_) {}
  }
  sessionId.value = `session_${Date.now()}`;
  showHistory.value = false;
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesEnd.value) {
    messagesEnd.value.scrollTo({ top: messagesEnd.value.scrollHeight, behavior: 'smooth' });
  }
};

const addMessage = (role, content, agentName = null) => {
  const msg = {
    id: `${role}_${Date.now()}_${Math.random()}`,
    role,
    content,
    agentName,
    timestamp: new Date().toISOString(),
    traces: [],
    latencyMs: null,
    userFeedback: null,
    feedbackSaved: false,
  };
  messages.value.push(msg);
  return msg;
};

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  inputText.value = '';
  error.value = null;

  addMessage('user', text);
  await scrollToBottom();

  isLoading.value = true;
  const assistantMsg = addMessage('assistant', '', 'Orchestrator');
  assistantMsg._sentAt = Date.now();

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

const useSuggestion = (text) => {
  inputText.value = text;
  sendMessage();
};

const clearChat = async () => {
  messages.value = [];
  error.value = null;
  try {
    await clearSession(sessionId.value);
  } catch (_) {}
  if (me.value) {
    try {
      const res = await createChatSession();
      sessionId.value = res?.session?.id || `session_${Date.now()}`;
      return;
    } catch (_) {}
  }
  sessionId.value = `session_${Date.now()}`;
};

const handleFeedback = async (payload) => {
  const { id, rating, helpful } = payload || {};
  const msg = messages.value.find((m) => m.id === id && m.role === 'assistant');
  if (!msg) return;

  msg.userFeedback = helpful ? 'up' : 'down';

  if (!me.value) {
    return;
  }

  try {
    await sendMetricsFeedback({
      chatSessionId: sessionId.value,
      latencyMs: typeof msg.latencyMs === 'number' ? msg.latencyMs : 0,
      rating,
      helpful,
      feedbackText: null,
    });
    msg.feedbackSaved = true;
  } catch (e) {
    error.value = e?.response?.data?.error || e?.message || 'Failed to send feedback';
  }
};

onMounted(async () => {
  connectWebSocket();
  try {
    const health = await checkHealth();
    updateStatus(health);
  } catch {
    statusClass.value = 'error';
    statusLabel.value = 'Backend offline';
  }
  try {
    const res = await getMe();
    me.value = res.user;
  } catch {
    me.value = null;
  }
  if (!me.value) {
    showLoginModal.value = true;
  } else {
    refreshHistory().catch(() => {});
  }
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

.messages-area {
  flex: 1;
  min-height: 0;
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
  padding-bottom: 8px;
}
</style>
