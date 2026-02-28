// Simple in-memory conversation store for unauthenticated users.
const conversationHistory = new Map();

export const getHistory = (sessionId) => conversationHistory.get(sessionId) || [];

export const addToHistory = (sessionId, role, content) => {
  const history = getHistory(sessionId);
  history.push({ role, content });
  // Keep last 20 messages to manage context size
  if (history.length > 20) history.splice(0, history.length - 20);
  conversationHistory.set(sessionId, history);
};

export const clearConversation = (sessionId) => {
  conversationHistory.delete(sessionId);
};

// Format history for OpenAI Agents SDK: content must be an array of content-part objects.
export const formatHistory = (history) =>
  history.map(({ role, content }) => ({
    role,
    content: [
      {
        type: role === 'user' ? 'input_text' : 'output_text',
        text: content,
      },
    ],
  }));

