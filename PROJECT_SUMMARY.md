# Project Summary

## Personalised Multi-Agent Orchestration System for Google Workspace

**Minor Project | BTech**

---

## Abstract

This project presents a **Personalised Multi-Agent Orchestration System** that integrates Large Language Model (LLM)–based AI agents with the Google ecosystem. The system enables users to manage their productivity tools—email, calendar, tasks—and **YouTube (videos and music)** through natural language interaction, alongside auxiliary capabilities such as news retrieval and web search. A central orchestrator agent intelligently routes user requests to specialised sub-agents, each responsible for a specific domain. The chat UI displays **video cards** for YouTube results and an **inline player** (with optional autoplay when the user asks to "play" a video or song). The system leverages the OpenAI Agents SDK for agent design and handoff logic, Google OAuth2 for secure access to user data, MongoDB for persistent user and chat history (including stored video lists for replay in History), and a modern Vue.js frontend for a conversational interface with a History panel to browse past conversations. The result is a unified, personalised assistant that streamlines daily workflow across multiple Google Workspace and YouTube services.

---

## Problem Statement

Individuals use several tools for productivity—Gmail for email, Google Calendar for scheduling, Google Tasks for to-dos—often switching between multiple interfaces. This fragmentation leads to:

- **Context switching** — Moving between apps breaks focus and wastes time
- **No unified interface** — Users must learn and navigate each service separately
- **Limited automation** — Simple actions require manual steps across apps

There is a need for a **single conversational interface** that understands intent and performs actions across these services on behalf of the user, using their own data in a secure, personalised manner.

---

## Objectives

1. **Design and implement** a multi-agent orchestration architecture where a central orchestrator routes requests to domain-specific agents.
2. **Integrate** with Google Workspace APIs (Gmail, Calendar, Tasks) to provide personalised, user-specific functionality.
3. **Enable natural language interaction** so users can issue commands in plain English (e.g., “Read my emails”, “Schedule a meeting tomorrow at 3pm”).
4. **Extend the system** with complementary agents (News, Web Search) to support information retrieval beyond productivity tools.
5. **Deliver a production-quality** chat interface with real-time feedback and a clear user experience.

---

## Scope

### In Scope
- Email management (read, send, search) via Gmail API
- Calendar management (list, create, delete, search events) via Google Calendar API
- Task management (list, create, complete, delete) via Google Tasks API
- **YouTube** (channel, playlists, search videos, **search music** / YouTube Music–style) via YouTube Data API v3; video results shown as cards in chat with **inline player** and optional **autoplay** when user asks to "play"
- News retrieval (headlines, topic-based, location-based)
- General web search
- Natural language intent routing via LLM orchestrator
- Real-time WebSocket chat interface
- Persistent chat history (user data and session messages, including **videos** for YouTube replies, stored in MongoDB; History UI to browse and reopen past conversations with video cards)
- MCP (Model Context Protocol) server over stdio for tool exposure; API to list/update MCP server config
- User settings (e.g. OpenAI API key override, model choice) persisted per user; Settings panel in the UI

### Out of Scope
- Multi-user authentication beyond single-account OAuth
- Mobile-native applications

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Orchestrator** | Central agent that interprets user intent and delegates to the appropriate sub-agent |
| **Email Assistant** | Read unread emails, send emails, search inbox using Gmail API |
| **Calendar Assistant** | List upcoming events, create events, delete events, search by date/keyword |
| **Tasks Assistant** | List task lists and tasks, create tasks, mark complete, delete tasks |
| **News Assistant** | Top headlines, search news, news by topic (tech, sports, etc.), news by location |
| **YouTube Assistant** | Get channel, list playlists, list playlist items, search videos, **search music** (YouTube Music–style); results shown as video cards with inline play (and autoplay first when user says "play") |
| **Search Assistant** | General web search for lookups and information retrieval |
| **Natural Language** | All interactions via conversational prompts; no rigid command syntax |
| **Chat History** | Persistent storage of conversations; users can view, reopen, and continue past sessions via the History panel |
| **Personalisation** | All Google services use the authenticated user’s own data |
| **MCP** | Backend runs as MCP server (stdio); tools from registry exposed via MCP; UI Integrations panel to manage MCP server config |
| **User Settings** | Per-user settings (OpenAI key override, model selection) stored in MongoDB; Settings panel in the UI |

---

## Architecture Overview

```
User → Vue.js Chat UI (Port 5173)
        ↓ HTTP REST / WebSocket
Node.js Express Server (Port 3001)
        ↓
MongoDB — users, google_tokens, sessions, chat_sessions, chat_messages, chat_metrics, user_settings
        ↓
Orchestrator Agent (GPT-4o)
        ↓ handoff()
   ┌────┴────┬────────┬────────┬────────┐
   ↓         ↓        ↓        ↓        ↓
Email    Calendar  Tasks  YouTube  News   Search
Agent    Agent     Agent   Agent   Agent  Agent
   ↓         ↓        ↓        ↓        ↓
Gmail API  Cal API  Tasks  YouTube  gnews  duck-duck-scrape
                        API v3

MCP: backend/src/mcp/server.js (stdio) ←→ tools/registry.js → registerTools → MCP clients (e.g. Cursor)
API: GET/POST /api/mcp/servers (mcp.config.json); GET/PUT /api/settings (user_settings)
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| AI / Agents | OpenAI Agents SDK, GPT-4o |
| Backend | Node.js, Express, WebSocket (ws) |
| Google APIs | Gmail API, Google Calendar API, Google Tasks API, YouTube Data API v3 |
| Authentication | Google OAuth2 |
| Database | MongoDB — users, auth sessions, chat_sessions, chat_messages, chat_metrics, user_settings |
| Frontend | Vue 3, Vite, Axios |
| Styling | Vanilla CSS (glassmorphism dark theme) |
| News | gnews (Google News RSS) |
| Web Search | duck-duck-scrape (DuckDuckGo) |
| MCP | @modelcontextprotocol/sdk — stdio server, tool registry, tool bridge for agents |

---

## Deliverables

1. **Backend** — REST API and WebSocket server with orchestrator and six sub-agents (Email, Calendar, Tasks, **YouTube**, News, Search); MongoDB-backed user and chat history (including `videos` on assistant messages for YouTube); WebSocket response includes `videos` when YouTube agent returns a list; MCP stdio server and `/api/mcp/servers` for MCP config; `/api/settings` for per-user settings (OpenAI key, model). Reusable **utils** (e.g. `youtubeHelpers` for video normalization and stream tool-output parsing, `toolDisplay` for friendly tool names and stream-item helpers) keep tools and WebSocket logic maintainable.
2. **Frontend** — Vue.js chat interface with conversation starters, real-time traces, per-message latency display, **YouTube video cards and inline player** (with autoplay when user asks to "play"), History panel to browse and reopen past conversations (with video cards restored), Integrations panel for MCP servers, Settings panel for user preferences; inline thumbs-up/down feedback for assistant responses. **Utils** (messageUtils, formatUtils, agentDisplay), **composables** (useWebSocketChat, useNavigation), and split **components** (ThinkingIndicator, ExecutionTrace, YouTubeVideoList, etc.) keep the chat UI modular and testable.
3. **Documentation** — Root README, backend and frontend READMEs, setup instructions, and this project summary
4. **Configuration** — Environment template for API keys, OAuth credentials, and `MONGODB_URI`; `mcp.config.json` for MCP server entries
5. **Evaluation metrics** — `chat_metrics` records are created only when the user submits feedback (e.g. thumbs up/down) via the UI; summary endpoint reports count, avg latency, and avg rating over those feedbacked responses

---

## Future Work

- Scale MongoDB (sharding, read replicas) or consider other databases for very large-scale deployment
- Extend multi-user support (currently based on secure auth sessions and cookies) with more granular roles/permissions
- Add more Google Workspace integrations (e.g., Google Drive, Google Keep); extend YouTube (e.g. upload, modify playlists) with additional scopes
- Further harden error handling, rate limiting, and observability for production scale
- Enhance evaluation metrics (e.g., per-agent success rates, richer user satisfaction surveys) for assessment

---

## Conclusion

This project demonstrates the design and implementation of a **personalised multi-agent orchestration system** that integrates LLMs with the Google environment. Users can interact with their email, calendar, tasks, and **YouTube (videos and music)**—along with news and web search—through a single conversational interface. YouTube results appear as **video cards** with an **inline player**; when the user asks to "play" a video or song, the first result opens and autoplays. User data and chat history are persisted in MongoDB, enabling users to revisit and continue past conversations via the History panel. The backend exposes the same tool set via **MCP (Model Context Protocol)** over stdio for use by MCP clients (e.g. Cursor), with an API and Integrations panel to manage MCP server configuration. Per-user **settings** (e.g. OpenAI key override, model choice) are stored in MongoDB and editable in the Settings panel. **Code organization**—backend utils (youtubeHelpers, toolDisplay) and frontend utils (messageUtils, formatUtils, agentDisplay), composables (useWebSocketChat), and split components (ThinkingIndicator, ExecutionTrace)—supports reuse and maintainability. Robust session management, improved error handling, request rate limiting, structured logging, and evaluation metrics (latency and user feedback) bring the system closer to production-grade quality. The architecture is extensible, allowing new agents and UI features to be added with minimal changes to the orchestrator. The system is suitable as a BTech minor project and provides a foundation for further research in multi-agent systems and human–AI productivity tools.
