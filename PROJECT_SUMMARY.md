# Project Summary

## Personalised Multi-Agent Orchestration System for Google Workspace

**Minor Project | BTech**

---

## Abstract

This project presents a **Personalised Multi-Agent Orchestration System** that integrates Large Language Model (LLM)–based AI agents with the Google ecosystem. The system enables users to manage their productivity tools—email, calendar, tasks—through natural language interaction, alongside auxiliary capabilities such as news retrieval and web search. A central orchestrator agent intelligently routes user requests to specialised sub-agents, each responsible for a specific domain. The system leverages the OpenAI Agents SDK for agent design and handoff logic, Google OAuth2 for secure access to user data, SQLite for persistent user and chat history, and a modern Vue.js frontend for a conversational interface with a History panel to browse past conversations. The result is a unified, personalised assistant that streamlines daily workflow across multiple Google Workspace services.

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
- News retrieval (headlines, topic-based, location-based)
- General web search
- Natural language intent routing via LLM orchestrator
- Real-time WebSocket chat interface
- Persistent chat history (user data and session messages stored in SQLite; History UI to browse and reopen past conversations)

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
| **Search Assistant** | General web search for lookups and information retrieval |
| **Natural Language** | All interactions via conversational prompts; no rigid command syntax |
| **Chat History** | Persistent storage of conversations; users can view, reopen, and continue past sessions via the History panel |
| **Personalisation** | All Google services use the authenticated user’s own data |

---

## Architecture Overview

```
User → Vue.js Chat UI (Port 5173)
        ↓ HTTP REST / WebSocket
Node.js Express Server (Port 3001)
        ↓
SQLite (sql.js) — users, chat_sessions, chat_messages
        ↓
Orchestrator Agent (GPT-4o)
        ↓ handoff()
   ┌────┴────┬────────┬────────┐
   ↓         ↓        ↓        ↓
Email    Calendar  Tasks   News   Search
Agent    Agent     Agent   Agent  Agent
   ↓         ↓        ↓        ↓
Gmail API  Cal API  Tasks API  gnews  duck-duck-scrape
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| AI / Agents | OpenAI Agents SDK, GPT-4o |
| Backend | Node.js, Express, WebSocket (ws) |
| Google APIs | Gmail API, Google Calendar API, Google Tasks API |
| Authentication | Google OAuth2 |
| Database | SQLite (sql.js) — users, auth sessions, chat_sessions, chat_messages, chat_metrics |
| Frontend | Vue 3, Vite, Axios |
| Styling | Vanilla CSS (glassmorphism dark theme) |
| News | gnews (Google News RSS) |
| Web Search | duck-duck-scrape (DuckDuckGo) |

---

## Deliverables

1. **Backend** — REST API and WebSocket server with orchestrator and six sub-agents; SQLite-backed user and chat history persistence
2. **Frontend** — Vue.js chat interface with conversation starters, real-time traces, per-message latency display, and History panel to browse and reopen past conversations; inline thumbs-up/down feedback for assistant responses
3. **Documentation** — README, setup instructions, and this project summary
4. **Configuration** — Environment template for API keys and OAuth credentials

---

## Future Work

- Migrate to PostgreSQL or another production database for larger-scale deployment
- Extend multi-user support (currently based on secure auth sessions and cookies) with more granular roles/permissions
- Add more Google Workspace integrations (e.g., Google Drive, Google Keep)
- Further harden error handling, rate limiting, and observability for production scale
- Enhance evaluation metrics (e.g., per-agent success rates, richer user satisfaction surveys) for assessment

---

## Conclusion

This project demonstrates the design and implementation of a **personalised multi-agent orchestration system** that integrates LLMs with the Google environment. Users can interact with their email, calendar, and tasks—along with news and web search—through a single conversational interface. User data and chat history are persisted in SQLite, enabling users to revisit and continue past conversations via the History panel. Robust session management, improved error handling, request rate limiting, structured logging, and evaluation metrics (latency and user feedback) bring the system closer to production-grade quality. The architecture is extensible, allowing new agents and UI features to be added with minimal changes to the orchestrator. The system is suitable as a BTech minor project and provides a foundation for further research in multi-agent systems and human–AI productivity tools.
