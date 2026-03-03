import { WebSocketServer } from 'ws';
import { createOrchestratorAgent } from '../agents/orchestrator.js';
import { runAgent, resolveOpenAIConfig } from '../utils/openaiRun.js';
import {
  getUserBySessionId,
  addChatMessage,
  getChatMessagesForAgentContext,
} from '../db/db.js';
import { parseCookies, SESSION_COOKIE } from '../auth/session.js';
import { runWithContext } from '../auth/requestContext.js';
import { resolveGoogleContext } from '../auth/googleContext.js';
import { getHistory, addToHistory, formatHistory } from '../chat/conversationMemory.js';
import { logger } from '../utils/logger.js';

export const attachChatWebSocketServer = ({ server, developerMode }) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    const sessionId = `ws_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    logger.info('ws.connection.open', { sessionId });

    // Resolve user once on connection (cookie sent during WS upgrade)
    let wsUser = null;
    let wsUserId = null;
    try {
      const cookies = parseCookies(req?.headers?.cookie);
      const sid = cookies[SESSION_COOKIE];
      if (sid) {
        wsUser = await getUserBySessionId(sid);
        wsUserId = wsUser?.id || null;
        logger.debug('ws.connection.user', { sessionId, userId: wsUserId });
      }
    } catch {
      wsUserId = null;
    }

    // Per-connection rate limiting (simple sliding window)
    const WS_WINDOW_MS = 10_000; // 10 seconds
    const WS_MAX_MESSAGES = 10;
    let messageTimestamps = [];

    ws.on('message', async (data) => {
      const nowTs = Date.now();
      const windowStart = nowTs - WS_WINDOW_MS;
      messageTimestamps = messageTimestamps.filter((t) => t >= windowStart);

      if (messageTimestamps.length >= WS_MAX_MESSAGES) {
        logger.warn('ws.rate_limited', { sessionId, userId: wsUserId });
        ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded, please slow down.' }));
        return;
      }
      messageTimestamps.push(nowTs);

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

      const openaiConfig = await resolveOpenAIConfig(wsUserId, developerMode);
      if (!openaiConfig.apiKey) {
        ws.send(JSON.stringify({ type: 'error', message: 'OpenAI API key not configured. Set it in Settings or in server .env.' }));
        return;
      }

      try {
        ws.send(JSON.stringify({ type: 'status', status: 'thinking', sessionId: clientSessionId }));

        const trimmed = message.trim();

        let history = null;
        let effectiveSessionId = clientSessionId;
        if (wsUserId) {
          logger.debug('ws.chat.history.db', { userId: wsUserId, sessionId: clientSessionId });
          const userMsg = await addChatMessage({
            chatSessionId: clientSessionId,
            userId: wsUserId,
            role: 'user',
            content: trimmed,
          });
          effectiveSessionId = userMsg.sessionId || clientSessionId;
          history = await getChatMessagesForAgentContext({
            chatSessionId: effectiveSessionId,
            userId: wsUserId,
            limit: 20,
          });
        } else {
          console.log('[ChatWS] Using in-memory history (unauthenticated). Session:', clientSessionId);
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
        const requestContext = { userId: wsUserId, developerMode, ...googleCtx };
        logger.debug('ws.chat.request_context', {
          userId: wsUserId,
          hasGoogleToken: !!requestContext.googleRefreshToken,
          developerMode,
        });
        const orchestratorAgent = createOrchestratorAgent(requestContext);
        const result = await runWithContext(
          requestContext,
          async () => await runAgent(orchestratorAgent, agentInput, { userId: wsUserId, stream: true, developerMode })
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
                  sessionId: effectiveSessionId,
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
                  sessionId: effectiveSessionId,
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
                  sessionId: effectiveSessionId,
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
                  sessionId: effectiveSessionId,
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
                  sessionId: effectiveSessionId,
                })
              );
            }
          }
        }

        const finalReply = result.finalOutput || 'No response generated.';
        const finalAgentName = result.lastAgent?.name || lastAgentName;

        if (wsUserId) {
          logger.debug('ws.chat.message.persist', {
            userId: wsUserId,
            sessionId: effectiveSessionId,
            agentName: finalAgentName,
          });
          await addChatMessage({
            chatSessionId: effectiveSessionId,
            userId: wsUserId,
            role: 'assistant',
            content: finalReply,
            agentName: finalAgentName,
          });
        } else {
          addToHistory(clientSessionId, 'assistant', finalReply);
        }

        ws.send(
          JSON.stringify({
            type: 'response',
            reply: finalReply,
            agentName: finalAgentName,
            sessionId: effectiveSessionId,
          })
        );
      } catch (err) {
        logger.error('ws.chat.error', {
          sessionId,
          userId: wsUserId,
          error: err.message,
        });
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    });

    ws.on('close', () => {
      logger.info('ws.connection.close', { sessionId, userId: wsUserId });
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

