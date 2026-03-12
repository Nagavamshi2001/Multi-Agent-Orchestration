/**
 * Agent and trace display helpers (icons, labels).
 */

/**
 * Get emoji icon for an agent name (and optional message context).
 * @param {string} agentName
 * @param {object} [message] - Full message object (e.g. for videos → YouTube icon)
 * @returns {string}
 */
export function getAgentType(agentName, message = null) {
  const name = (agentName || '').toLowerCase();
  if (name.includes('email')) return 'email';
  if (name.includes('calendar')) return 'calendar';
  if (name.includes('youtube') || (message?.videos?.length)) return 'youtube';
  if (name.includes('docs') || (message?.docs?.length)) return 'docs';
  if (name.includes('sheets') || (message?.sheets?.length)) return 'sheets';
  if (name.includes('tasks')) return 'tasks';
  if (name.includes('news')) return 'news';
  if (name.includes('search')) return 'search';
  if (name.includes('orchestrator')) return 'orchestrator';
  return 'default';
}

/**
 * Get icon for a trace step (tool_start, handoff, etc.).
 * @param {string} step
 * @returns {string}
 */
export function getTraceIcon(step) {
  const icons = {
    handoff_init: '🧠',
    handoff: '🔄',
    tool_start: '⚙️',
    tool_end: '✅',
    reasoning: '⚡',
  };
  return icons[step] ?? '•';
}
