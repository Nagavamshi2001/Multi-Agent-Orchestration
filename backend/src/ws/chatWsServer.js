import { WebSocketServer } from 'ws';
import { run } from '@openai/agents';
import orchestratorAgent from '../agents/orchestrator.js';
import { getUserBySessionId } from '../db/db.js';
import { parseCookies, SESSION_COOKIE } from '../auth/session.js';
import { runWithContext } from '../auth/requestContext.js';
import { resolveGoogleContext } from '../auth/googleContext.js';
import { getHistory, addToHistory, formatHistory } from '../chat/conversationMemory.js';

export const attachChatWebSocketServer = ({ server, developerMode }) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    const sessionId = `ws_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    console.log(`[WebSocket] New connection: ${sessionId}`);

    // Resolve user once on connection (cookie sent during WS upgrade)
    let wsUser = null;
    let wsUserId = null;
    try {
      const cookies = parseCookies(req?.headers?.cookie);
      const sid = cookies[SESSION_COOKIE];
      if (sid) {
        wsUser = await getUserBySessionId(sid);
        wsUserId = wsUser?.id || null;
      }
    } catch {
      wsUserId = null;
    }

    ws.on('message', async (data) => {
      let payload;
      try {
        payload = JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON payload' }));
        return;
      }

      const { message, sessionId: clientSessionId = sessionId } = payload;

      if (!message?.trim()) {
        ws.send(JSON.stringify({ type: 'error', message: 'Message cannot be empty' }));
        return;
      }

      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
        ws.send(JSON.stringify({ type: 'error', message: 'OpenAI API key not configured.' }));
        return;
      }

      try {
        ws.send(JSON.stringify({ type: 'status', status: 'thinking', sessionId: clientSessionId }));

        const trimmed = message.trim();

        let history = null;
        if (wsUserId) {
          // DB-backed history for authenticated users is handled in server.js chat routes; for WS,
          // we reuse the in-memory short-term history to build context (like for unauth users).
          addToHistory(clientSessionId, 'user', trimmed);
          history = getHistory(clientSessionId);
        } else {
          addToHistory(clientSessionId, 'user', trimmed);
          history = getHistory(clientSessionId);
        }
        const agentInput = formatHistory(history);

        // Use streaming mode to capture intermediate events (traces/thoughts)
        const googleCtx = await resolveGoogleContext({
          userId: wsUserId,
          userEmail: wsUser?.email,
          developerMode,
        });
        const result = await runWithContext(
          { userId: wsUserId, developerMode, ...googleCtx },
          async () => await run(orchestratorAgent, agentInput, { stream: true })
        );

        let lastAgentName = orchestratorAgent.name;

        const getFriendlyToolMessage = (toolName) => {
          if (!toolName || toolName === 'action') return 'Executing action...';
          const maps = {
            read_unread_emails: 'Reading your unread emails...',
            send_email: 'Composing and sending email...',
            search_emails: 'Searching your inbox...',
            delegate_to_email_assistant: 'Consulting the Email Assistant...',
            list_upcoming_events: 'Fetching your upcoming events...',
            create_calendar_event: 'Creating calendar event...',
            delete_calendar_event: 'Deleting calendar event...',
            search_calendar_events: 'Searching your calendar...',
            get_calendar_event: 'Fetching event details...',
            update_calendar_event: 'Updating calendar event...',
            list_calendars: 'Listing your calendars...',
            delegate_to_calendar_assistant: 'Consulting the Calendar Assistant...',
            list_task_lists: 'Fetching your task lists...',
            list_tasks: 'Fetching your tasks...',
            create_task: 'Creating task...',
            complete_task: 'Marking task complete...',
            delete_task: 'Deleting task...',
            delegate_to_tasks_assistant: 'Consulting the Tasks Assistant...',
            get_headlines: 'Fetching headlines...',
            search_news: 'Searching news...',
            get_news_by_topic: 'Fetching news by topic...',
            get_news_by_location: 'Fetching news by location...',
            delegate_to_news_assistant: 'Consulting the News Assistant...',
            web_search: 'Searching the web...',
            delegate_to_search_assistant: 'Consulting the Search Assistant...',
            handoff_to_orchestrator: 'Returning to Orchestrator...',
          };
          const formattedName = toolName.replace(/delegate_to_/g, '').replace(/_/g, ' ');
          return maps[toolName] || `Executing ${formattedName}...`;
        };

        for await (const event of result) {
          if (event.type === 'agent_updated_stream_event') {
            lastAgentName = event.agent.name;
          } else if (event.type === 'run_item_stream_event') {
            const { name, item } = event;

            if (name === 'tool_called' || name === 'tool_called_item_created') {
              const toolName =
                item?.function?.name || item?.name || item?.rawItem?.name || item?.toolName || 'action';
              ws.send(
                JSON.stringify({
                  type: 'trace',
                  step: 'tool_start',
                  agentName: lastAgentName,
                  tool: toolName,
                  message: getFriendlyToolMessage(toolName),
                  sessionId: clientSessionId,
                })
              );
            } else if (name === 'handoff_requested') {
              const targetAgent =
                item?.handoff_target || item?.function?.name || item?.name || item?.rawItem?.name || 'another agent';
              ws.send(
                JSON.stringify({
                  type: 'trace',
                  step: 'handoff_init',
                  agentName: lastAgentName,
                  message: `Decided to route to ${targetAgent.replace(/delegate_to_/g, '').replace(/_/g, ' ')}...`,
                  sessionId: clientSessionId,
                })
              );
            } else if (name === 'handoff_occurred') {
              const targetAgentName = item.targetAgent?.name || 'another agent';
              ws.send(
                JSON.stringify({
                  type: 'trace',
                  step: 'handoff',
                  agentName: targetAgentName,
                  message: `Switched to ${targetAgentName}`,
                  sessionId: clientSessionId,
                })
              );
            } else if (name === 'reasoning_item_created') {
              let reasoningText = 'Analyzing request...';
              try {
                if (item.rawItem?.content && Array.isArray(item.rawItem.content)) {
                  const textPart = item.rawItem.content.find(
                    (c) => c.type === 'input_text' || c.type === 'output_text' || c.type === 'text'
                  );
                  if (textPart && textPart.text) {
                    reasoningText = textPart.text;
                  }
                }
              } catch {
                // ignore and use fallback
              }

              ws.send(
                JSON.stringify({
                  type: 'trace',
                  step: 'reasoning',
                  agentName: lastAgentName,
                  message: reasoningText,
                  sessionId: clientSessionId,
                })
              );
            } else if (name === 'tool_output') {
              const toolName =
                item?.function?.name || item?.name || item?.rawItem?.name || item?.toolName || 'action';
              ws.send(
                JSON.stringify({
                  type: 'trace',
                  step: 'tool_end',
                  agentName: lastAgentName,
                  tool: toolName,
                  message: `Completed action: ${toolName.replace(/delegate_to_/g, '').replace(/_/g, ' ')}`,
                  sessionId: clientSessionId,
                })
              );
            }
          }
        }

        const finalReply = result.finalOutput || 'No response generated.';
        const finalAgentName = result.lastAgent?.name || lastAgentName;

        addToHistory(clientSessionId, 'assistant', finalReply);

        ws.send(
          JSON.stringify({
            type: 'response',
            reply: finalReply,
            agentName: finalAgentName,
            sessionId: clientSessionId,
          })
        );
      } catch (err) {
        console.error('[WebSocket] Error:', err);
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Disconnected: ${sessionId}`);
    });

    ws.send(
      JSON.stringify({
        type: 'connected',
        sessionId,
        message: 'Connected to Multi-Agent Orchestrator',
      })
    );
  });
};

