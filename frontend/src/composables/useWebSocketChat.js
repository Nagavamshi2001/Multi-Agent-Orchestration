/**
 * Composable for WebSocket chat: connect, send message, handle trace/response/error.
 * Updates messages, sessionId, isLoading, and error refs.
 */
import { WS_URL } from '../config/index.js';
import {
  findLastMessageByRole,
  shouldAutoPlayFirst,
} from '../utils/messageUtils.js';

/**
 * @param {import('vue').Ref<Array>} messagesRef
 * @param {import('vue').Ref<string>} sessionIdRef
 * @param {import('vue').Ref<boolean>} isLoadingRef
 * @param {import('vue').Ref<string|null>} errorRef
 * @param {{ onOpen?: () => void, onClose?: () => void, onResponse?: () => void }} [options]
 * @returns {{ connectWebSocket: () => void, sendMessage: (text: string) => boolean }}
 */
export function useWebSocketChat(messagesRef, sessionIdRef, isLoadingRef, errorRef, options = {}) {
  const { onOpen, onClose, onResponse } = options;
  let socket = null;

  function connectWebSocket() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      onOpen?.();
    };

    socket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === 'trace') {
        const lastMsg = findLastMessageByRole(messagesRef.value, 'assistant');
        if (lastMsg) {
          if (!lastMsg.traces) lastMsg.traces = [];
          lastMsg.traces.push({
            id: Date.now(),
            message: data.message,
            agentName: data.agentName,
            step: data.step,
          });
        }
      } else if (data.type === 'response') {
        const lastMsg = findLastMessageByRole(messagesRef.value, 'assistant');
        if (lastMsg) {
          lastMsg.content = data.reply;
          lastMsg.agentName = data.agentName;
          lastMsg.videos = data.videos ?? null;
          lastMsg.autoPlayFirst = shouldAutoPlayFirst(
            messagesRef.value,
            lastMsg,
            data.videos
          );
          const nowTs = Date.now();
          const base = lastMsg._sentAt ?? nowTs;
          lastMsg.latencyMs = nowTs - base;
        }
        if (data.sessionId) {
          sessionIdRef.value = data.sessionId;
        }
        isLoadingRef.value = false;
        onResponse?.();
      } else if (data.type === 'error') {
        errorRef.value = data.message;
        isLoadingRef.value = false;
      }
    };

    socket.onclose = () => {
      onClose?.();
      setTimeout(connectWebSocket, 3000);
    };
  }

  /**
   * Send a user message over the WebSocket. Caller must add user and assistant messages to the list and scroll.
   * @param {string} text
   * @returns {boolean} true if sent, false if not connected
   */
  function sendMessage(text) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(
      JSON.stringify({
        message: text,
        sessionId: sessionIdRef.value,
      })
    );
    return true;
  }

  return { connectWebSocket, sendMessage };
}
