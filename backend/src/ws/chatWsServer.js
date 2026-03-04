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
import { getHistory, addToHistory, formatHistoryWithDateTime } from '../chat/conversationMemory.js';
import { logger } from '../utils/logger.js';
import { getFriendlyToolMessage, getToolNameFromItem } from '../utils/toolDisplay.js';
import {
  getVideosFromStreamToolOutput,
  YOUTUBE_AGENT_NAME,
} from '../utils/youtubeHelpers.js';

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
        const agentInput = formatHistoryWithDateTime(history);

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
        let lastYouTubeVideos = null;

        for await (const event of result) {
          if (event.type === 'agent_updated_stream_event') {
            lastAgentName = event.agent.name;
          } else if (event.type === 'run_item_stream_event') {
            const { name, item } = event;

            if (name === 'tool_called' || name === 'tool_called_item_created') {
              const toolName = getToolNameFromItem(item);
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
              const toolName = getToolNameFromItem(item);
              const videos = getVideosFromStreamToolOutput(item, toolName);
              if (videos?.length) lastYouTubeVideos = videos;
              ws.send(
                JSON.stringify({
                  type: 'trace',
                  step: 'tool_end',
                  agentName: lastAgentName,
                  tool: toolName,
                  message: getFriendlyToolMessage(toolName),
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
            videos: finalAgentName === YOUTUBE_AGENT_NAME && lastYouTubeVideos?.length ? lastYouTubeVideos : undefined,
          });
        } else {
          addToHistory(clientSessionId, 'assistant', finalReply);
        }

        const responsePayload = {
          type: 'response',
          reply: finalReply,
          agentName: finalAgentName,
          sessionId: effectiveSessionId,
        };
        if (finalAgentName === YOUTUBE_AGENT_NAME && lastYouTubeVideos?.length) {
          responsePayload.videos = lastYouTubeVideos;
        }
        ws.send(JSON.stringify(responsePayload));
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

