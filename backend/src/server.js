import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { run } from '@openai/agents';
import dotenv from 'dotenv';
import orchestratorAgent from './agents/orchestrator.js';
import { isEmailConfigured } from './tools/emailTools.js';
import { isCalendarConfigured } from './tools/calendarTools.js';
import { isTasksConfigured } from './tools/tasksTools.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Conversation History Store ───────────────────────────────────────────────
// In-memory store keyed by sessionId (replace with DB for production)
const conversationHistory = new Map();

const getHistory = (sessionId) => conversationHistory.get(sessionId) || [];
const addToHistory = (sessionId, role, content) => {
    const history = getHistory(sessionId);
    history.push({ role, content });
    // Keep last 20 messages to manage context size
    if (history.length > 20) history.splice(0, history.length - 20);
    conversationHistory.set(sessionId, history);
};

// ─── Format history for OpenAI Agents SDK ────────────────────────────────────
// The SDK requires content to be an array of content-part objects, not a string.
const formatHistory = (history) =>
    history.map(({ role, content }) => ({
        role,
        content: [
            {
                type: role === 'user' ? 'input_text' : 'output_text',
                text: content,
            },
        ],
    }));

// ─── REST: Health Check ───────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        agents: ['orchestrator', 'emailAssistant', 'calendarAssistant', 'tasksAssistant', 'newsAssistant', 'searchAssistant'],
        emailConfigured: isEmailConfigured(),
        calendarConfigured: isCalendarConfigured(),
        tasksConfigured: isTasksConfigured(),
        openaiConfigured: !!process.env.OPENAI_API_KEY,
    });
});

// ─── REST: Chat Endpoint ──────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const { message, sessionId = 'default' } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
        return res.status(500).json({
            error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.',
        });
    }

    try {
        console.log(`[Chat] sessionId=${sessionId} | message="${message.substring(0, 80)}..."`);

        addToHistory(sessionId, 'user', message.trim());
        const history = getHistory(sessionId);

        // Format history into SDK-compatible content-part arrays
        const agentInput = formatHistory(history);

        // Run the orchestrator — it will handoff to sub-agents as needed
        const result = await run(orchestratorAgent, agentInput);

        const assistantReply = result.finalOutput || 'I could not generate a response. Please try again.';

        // Track which agent ultimately answered
        const lastAgentName = result.lastAgent?.name || 'Orchestrator';

        addToHistory(sessionId, 'assistant', assistantReply);

        return res.json({
            reply: assistantReply,
            agentName: lastAgentName,
            sessionId,
        });
    } catch (err) {
        console.error('[Chat] Error:', err);
        return res.status(500).json({
            error: `An error occurred: ${err.message}`,
        });
    }
});

// ─── REST: Clear Session History ──────────────────────────────────────────────
app.delete('/api/chat/:sessionId', (req, res) => {
    conversationHistory.delete(req.params.sessionId);
    res.json({ success: true, message: 'Session history cleared' });
});

// ─── WebSocket: Streaming Chat ────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
    const sessionId = `ws_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    console.log(`[WebSocket] New connection: ${sessionId}`);

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

            addToHistory(clientSessionId, 'user', message.trim());
            const history = getHistory(clientSessionId);
            const agentInput = formatHistory(history);

            // Use streaming mode to capture intermediate events (traces/thoughts)
            const result = await run(orchestratorAgent, agentInput, { stream: true });

            let lastAgentName = orchestratorAgent.name;

            // Iterate over the stream of events
            // Map internal tool names to human-friendly descriptions
            const getFriendlyToolMessage = (toolName) => {
                if (!toolName || toolName === 'action') return 'Executing action...';
                const maps = {
                    'read_unread_emails': 'Reading your unread emails...',
                    'send_email': 'Composing and sending email...',
                    'search_emails': 'Searching your inbox...',
                    'delegate_to_email_assistant': 'Consulting the Email Assistant...',
                    'list_upcoming_events': 'Fetching your upcoming events...',
                    'create_calendar_event': 'Creating calendar event...',
                    'delete_calendar_event': 'Deleting calendar event...',
                    'search_calendar_events': 'Searching your calendar...',
                    'delegate_to_calendar_assistant': 'Consulting the Calendar Assistant...',
                    'list_task_lists': 'Fetching your task lists...',
                    'list_tasks': 'Fetching your tasks...',
                    'create_task': 'Creating task...',
                    'complete_task': 'Marking task complete...',
                    'delete_task': 'Deleting task...',
                    'delegate_to_tasks_assistant': 'Consulting the Tasks Assistant...',
                    'get_headlines': 'Fetching headlines...',
                    'search_news': 'Searching news...',
                    'get_news_by_topic': 'Fetching news by topic...',
                    'get_news_by_location': 'Fetching news by location...',
                    'delegate_to_news_assistant': 'Consulting the News Assistant...',
                    'web_search': 'Searching the web...',
                    'delegate_to_search_assistant': 'Consulting the Search Assistant...',
                    'handoff_to_orchestrator': 'Returning to Orchestrator...',
                };
                const formattedName = toolName.replace(/delegate_to_/g, '').replace(/_/g, ' ');
                return maps[toolName] || `Executing ${formattedName}...`;
            };

            for await (const event of result) {
                if (event.type === 'agent_updated_stream_event') {
                    lastAgentName = event.agent.name;
                    // Note: We don't always need a trace here if we have handoff_occurred
                } else if (event.type === 'run_item_stream_event') {
                    const { name, item } = event;

                    if (name === 'tool_called' || name === 'tool_called_item_created') {
                        const toolName = item?.function?.name || item?.name || item?.rawItem?.name || item?.toolName || 'action';
                        ws.send(JSON.stringify({
                            type: 'trace',
                            step: 'tool_start',
                            agentName: lastAgentName,
                            tool: toolName,
                            message: getFriendlyToolMessage(toolName),
                            sessionId: clientSessionId
                        }));
                    } else if (name === 'handoff_requested') {
                        const targetAgent = item?.handoff_target || item?.function?.name || item?.name || item?.rawItem?.name || 'another agent';
                        ws.send(JSON.stringify({
                            type: 'trace',
                            step: 'handoff_init',
                            agentName: lastAgentName,
                            message: `Decided to route to ${targetAgent.replace(/delegate_to_/g, '').replace(/_/g, ' ')}...`,
                            sessionId: clientSessionId
                        }));
                    } else if (name === 'handoff_occurred') {
                        const targetAgentName = item.targetAgent?.name || 'another agent';
                        ws.send(JSON.stringify({
                            type: 'trace',
                            step: 'handoff',
                            agentName: targetAgentName,
                            message: `Switched to ${targetAgentName}`,
                            sessionId: clientSessionId
                        }));
                    } else if (name === 'reasoning_item_created') {
                        // Attempt to extract actual thought text, fallback if empty
                        let reasoningText = 'Analyzing request...';
                        try {
                            if (item.rawItem?.content && Array.isArray(item.rawItem.content)) {
                                const textPart = item.rawItem.content.find(c => c.type === 'input_text' || c.type === 'output_text' || c.type === 'text');
                                if (textPart && textPart.text) {
                                    reasoningText = textPart.text;
                                }
                            }
                        } catch (e) {
                            // ignore and use fallback
                        }

                        ws.send(JSON.stringify({
                            type: 'trace',
                            step: 'reasoning',
                            agentName: lastAgentName,
                            message: reasoningText,
                            sessionId: clientSessionId
                        }));
                    } else if (name === 'tool_output') {
                        const toolName = item?.function?.name || item?.name || item?.rawItem?.name || item?.toolName || 'action';
                        ws.send(JSON.stringify({
                            type: 'trace',
                            step: 'tool_end',
                            agentName: lastAgentName,
                            tool: toolName,
                            message: `Completed action: ${toolName.replace(/delegate_to_/g, '').replace(/_/g, ' ')}`,
                            sessionId: clientSessionId
                        }));
                    }
                }
            }

            // Once stream is done, get the final results
            const finalReply = result.finalOutput || 'No response generated.';
            const finalAgentName = result.lastAgent?.name || lastAgentName;

            addToHistory(clientSessionId, 'assistant', finalReply);

            ws.send(JSON.stringify({
                type: 'response',
                reply: finalReply,
                agentName: finalAgentName,
                sessionId: clientSessionId,
            }));
        } catch (err) {
            console.error('[WebSocket] Error:', err);
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
        }
    });

    ws.on('close', () => {
        console.log(`[WebSocket] Disconnected: ${sessionId}`);
    });

    // Send welcome handshake
    ws.send(
        JSON.stringify({
            type: 'connected',
            sessionId,
            message: 'Connected to Multi-Agent Orchestrator',
        })
    );
});

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
    console.log('');
    console.log('🚀 Multi-Agent Orchestrator Server running!');
    console.log(`   REST API:  http://localhost:${PORT}/api`);
    console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`   Health:    http://localhost:${PORT}/api/health`);
    console.log('');
    console.log(`🔑 OpenAI API:  ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ NOT configured'}`);
    console.log(`📧 Gmail API:   ${isEmailConfigured() ? '✅ Configured' : '⚠️  Not configured (email tools disabled)'}`);
    console.log(`📅 Calendar API: ${isCalendarConfigured() ? '✅ Configured' : '⚠️  Not configured (calendar tools disabled)'}`);
    console.log(`✅ Tasks API:    ${isTasksConfigured() ? '✅ Configured' : '⚠️  Not configured (tasks tools disabled)'}`);
    console.log(`📰 News:        ✅ Ready (no API key needed)`);
    console.log(`🔍 Web Search:  ✅ Ready (no API key needed)`);
    console.log('');
});

export default app;
