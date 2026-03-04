/**
 * Message shape and helpers for chat UI.
 */

/**
 * Create a new message object for the messages list.
 * @param {string} role - 'user' | 'assistant'
 * @param {string} content
 * @param {string|null} [agentName]
 * @returns {object}
 */
export function createMessage(role, content, agentName = null) {
  return {
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
}

/**
 * Map a DB/API message to the shape expected by the UI.
 * @param {object} m - Raw message from getChatSessionMessages
 * @returns {object}
 */
export function mapDbMessageToUI(m) {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    agentName: m.agent_name ?? null,
    videos: m.videos ?? null,
    docs: m.docs ?? null,
    sheets: m.sheets ?? null,
    timestamp: new Date(Number(m.created_at)).toISOString(),
    traces: [],
  };
}

/**
 * Find the last message with the given role in the messages array.
 * @param {Array} messages
 * @param {string} role - 'user' | 'assistant'
 * @returns {object|undefined}
 */
export function findLastMessageByRole(messages, role) {
  if (!Array.isArray(messages)) return undefined;
  return [...messages].reverse().find((m) => m.role === role);
}

/**
 * Whether to auto-play the first video (user asked to "play" and response has videos).
 * @param {Array} messages - Current messages list
 * @param {object} lastAssistantMsg - The assistant message being updated
 * @param {Array|null} videos - Videos from the response
 * @returns {boolean}
 */
export function shouldAutoPlayFirst(messages, lastAssistantMsg, videos) {
  const hasVideos = Array.isArray(videos) && videos.length > 0;
  if (!hasVideos || !lastAssistantMsg) return false;
  const lastUserMsg = findLastMessageByRole(messages, 'user');
  const content = lastUserMsg?.content;
  if (!content || typeof content !== 'string') return false;
  return /\bplay\b/i.test(content.trim());
}
