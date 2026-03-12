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
    <ErrorToast v-model="error" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import MessageBubble from './MessageBubble.vue';
import EmptyState from './EmptyState.vue';
import ChatInput from './ChatInput.vue';
import LoginModal from './LoginModal.vue';
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
import { globalHistorySessions, globalHistoryLoading, globalSessionId } from '../store/chatState.js';

const messages = ref([]);
const inputText = ref('');
const isLoading = ref(false);
const error = ref(null);
const messagesEnd = ref(null);
const sessionId = globalSessionId;
const me = ref(null);
const showLoginModal = ref(false);
const historySessions = globalHistorySessions;
const historyLoading = globalHistoryLoading;
const historyError = ref(null);

const statusClass = ref('checking');
const statusLabel = ref('Connecting…');

watch(sessionId, (v) => {
  localStorage.setItem('sk_session_id', v);
});

const hasMessages = computed(() => messages.value.length > 0);

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
  window.history.replaceState({}, '', '/?login=true');
  window.location.href = `${API_BASE}/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
}

async function doLogout() {
  try {
    await apiLogout();
  } catch (_) {}
  me.value = null;
  deleteCurrentSession();
  showLoginModal.value = true;
  window.history.replaceState({}, '', '/?login=true');
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

async function openSession(chatSessionId) {
  if (!me.value) return;
  historyLoading.value = true;
  historyError.value = null;
  try {
    const res = await getChatSessionMessages(chatSessionId);
    messages.value = (res.messages || []).map(mapDbMessageToUI);
    sessionId.value = chatSessionId;
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
      return;
    } catch (_) {}
  }
  sessionId.value = `session_${Date.now()}`;
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

// ─── Delete session ─────────────────────────────────────────────────────────────────
async function deleteCurrentSession() {
  if (!messages.value.length) return;
  
  messages.value = [];
  error.value = null;
  try {
    await clearSession(sessionId.value);
  } catch (_) {}
  if (me.value) {
    try {
      const res = await createChatSession();
      sessionId.value = res?.session?.id || `session_${Date.now()}`;
      await refreshHistory();
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
    window.history.replaceState({}, '', '/?login=true');
  } else {
    // If logged in, clean up URL if needed
    const url = new URL(window.location.href);
    if (url.searchParams.has('login')) {
      url.searchParams.delete('login');
      const newUrl = url.pathname + (url.search ? url.search : '');
      window.history.replaceState({}, '', newUrl);
    }
    refreshHistory().catch(() => {});
  }
});

defineExpose({
  loginWithGoogle,
  doLogout,
  deleteCurrentSession,
  startNewChat,
  statusClass,
  statusLabel,
  me,
  historySessions,
  sessionId,
  historyLoading,
  openSession,
  refreshHistory,
  hasMessages
});
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
  position: relative;
  overflow: hidden;
}

.messages-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 24px 120px; /* Extra bottom padding for floating input */
  display: flex;
  flex-direction: column;
  align-items: center; /* Center the container */
  z-index: 1;
  /* Scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 800px; /* Constrain width */
  margin: 0 auto;
}

/* Add an elegant gradient mask at bottom for scrolling text behind input */
.chat-interface::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to top, var(--color-bg) 0%, transparent 100%);
  pointer-events: none;
  z-index: 2;
}

:deep(.empty-state) {
  max-width: 800px;
  width: 100%;
}
</style>
