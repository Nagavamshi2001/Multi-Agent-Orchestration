/**
 * Agent and trace display helpers (icons, labels).
 */

/**
 * Get emoji icon for an agent name (and optional message context).
 * @param {string} agentName
 * @param {object} [message] - Full message object (e.g. for videos → YouTube icon)
 * @returns {string}
 */
export function getAgentIcon(agentName, message = null) {
  const name = (agentName || '').toLowerCase();
  if (name.includes('email')) return '📧';
  if (name.includes('calendar')) return '📅';
  if (name.includes('youtube') || (message?.videos?.length)) return '🎬';
  if (name.includes('docs') || (message?.docs?.length)) return '📄';
  if (name.includes('sheets') || (message?.sheets?.length)) return '📊';
  return '🤖';
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
