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

/** Return current date and time for injection into the prompt (UTC). */
export const getCurrentDateTimeContext = () => {
  const now = new Date();
  const iso = now.toISOString();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const date = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'UTC' });
  return `Current date and time (UTC): ${weekday}, ${date}, ${time} UTC. ISO: ${iso}`;
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

/** Prepend current date/time as a user context message so the agent always knows "today" and "now". */
export const formatHistoryWithDateTime = (history) => {
  const dateTimeMessage = {
    role: 'user',
    content: [{ type: 'input_text', text: `[Context: ${getCurrentDateTimeContext()}]` }],
  };
  return [dateTimeMessage, ...formatHistory(history)];
};

