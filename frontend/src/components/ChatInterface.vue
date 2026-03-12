<template>
  <div class="chat-interface">
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
import { createMessage, mapDbMessageToUI } from '../utils/messageUtils.js';
import { useWebSocketChat } from '../composables/useWebSocketChat.js';

// ─── State ────────────────────────────────────────────────────────────────────
const messages = ref([]);
const inputText = ref('');
const isLoading = ref(false);
const error = ref(null);
const messagesEnd = ref(null);
const sessionId = ref(localStorage.getItem('sk_session_id') || `session_${Date.now()}`);
const me = ref(null);
const showLoginModal = ref(false);
const showHistory = ref(false);
const historySessions = ref([]);
const historyLoading = ref(false);
const historyError = ref(null);

const statusClass = ref('checking');
const statusLabel = ref('Connecting…');

watch(sessionId, (v) => {
  localStorage.setItem('sk_session_id', v);
});

// ─── WebSocket (composable) ─────────────────────────────────────────────────────
const { connectWebSocket, sendMessage: wsSend } = useWebSocketChat(
  messages,
  sessionId,
  isLoading,
  error,
  {
    onOpen: () => {
      statusClass.value = 'ok';
      statusLabel.value = 'Online';
    },
    onClose: () => {
      statusClass.value = 'error';
      statusLabel.value = 'Offline';
    },
    onResponse: () => {
      scrollToBottom();
    },
  }
);

// ─── Helpers ────────────────────────────────────────────────────────────────────
function updateStatus(health) {
  if (health?.openaiConfigured) {
    statusClass.value = 'ok';
    statusLabel.value = 'Online';
  } else {
    statusClass.value = 'warning';
    statusLabel.value = 'Config needed';
  }
}

async function scrollToBottom() {
  await nextTick();
  if (messagesEnd.value) {
    messagesEnd.value.scrollTo({ top: messagesEnd.value.scrollHeight, behavior: 'smooth' });
  }
}

function addMessage(role, content, agentName = null) {
  const msg = createMessage(role, content, agentName);
  messages.value.push(msg);
  return msg;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
function loginWithGoogle() {
  const returnTo = window.location.href;
  window.location.href = `${API_BASE}/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
}

async function doLogout() {
  try {
    await apiLogout();
  } catch (_) {}
  me.value = null;
  clearChat();
  showLoginModal.value = true;
}

// ─── History ───────────────────────────────────────────────────────────────────
async function refreshHistory() {
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
}

async function toggleHistory() {
  showHistory.value = !showHistory.value;
  if (showHistory.value) {
    await refreshHistory();
  }
}

async function openSession(chatSessionId) {
  if (!me.value) return;
  historyLoading.value = true;
  historyError.value = null;
  try {
    const res = await getChatSessionMessages(chatSessionId);
    messages.value = (res.messages || []).map(mapDbMessageToUI);
    sessionId.value = chatSessionId;
    showHistory.value = false;
    await scrollToBottom();
  } catch (e) {
    historyError.value = e?.response?.data?.error || e?.message || 'Failed to open chat';
  } finally {
    historyLoading.value = false;
  }
}

async function startNewChat() {
  messages.value = [];
  error.value = null;
  if (me.value) {
    try {
      const res = await createChatSession();
      sessionId.value = res?.session?.id || `session_${Date.now()}`;
      await refreshHistory();
      showHistory.value = false;
      return;
    } catch (_) {}
  }
  sessionId.value = `session_${Date.now()}`;
  showHistory.value = false;
}

// ─── Send message ──────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  inputText.value = '';
  error.value = null;

  addMessage('user', text);
  await scrollToBottom();

  isLoading.value = true;
  const assistantMsg = addMessage('assistant', '', 'Orchestrator');
  assistantMsg._sentAt = Date.now();

  if (!wsSend(text)) {
    error.value = 'Connection lost. Trying to reconnect...';
    isLoading.value = false;
  }
}

function useSuggestion(text) {
  inputText.value = text;
  sendMessage();
}

// ─── Clear chat ─────────────────────────────────────────────────────────────────
async function clearChat() {
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
}

// ─── Feedback ──────────────────────────────────────────────────────────────────
async function handleFeedback(payload) {
  const { id, rating, helpful } = payload || {};
  const msg = messages.value.find((m) => m.id === id && m.role === 'assistant');
  if (!msg) return;

  msg.userFeedback = helpful ? 'up' : 'down';

  if (!me.value) return;

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
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────────
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

defineExpose({
  loginWithGoogle,
  doLogout,
  toggleHistory,
  clearChat,
  startNewChat,
  statusClass,
  statusLabel,
  me,
});
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
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
