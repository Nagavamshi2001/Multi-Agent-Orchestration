# Backend – Multi-Agent Orchestrator (Node.js + Express)

This is the **Node.js/Express backend** for the AI Agent Hub. It exposes REST and WebSocket endpoints, runs the **OpenAI-based orchestrator**, and integrates with:

- Gmail (read/search/send mail)
- Google Calendar (events)
- Google Tasks
- News (via `gnews`)
- Web search (via `duck-duck-scrape`)

The orchestrator decides when to delegate work to each specialist sub‑agent.

## Prerequisites

- **Node.js** `>= 18.0.0`
- **OpenAI API key**
- **Google OAuth2 credentials** with scopes for:
  - Gmail API
  - Google Calendar API
  - Google Tasks API

## Installation

From the project root:

```bash
cd backend
npm install
cp .env.example .env   # then edit .env
```

> `.env` is not committed; use `.env.example` as your template.

## Scripts

- **Development (auto‑reload)**

  ```bash
  npm run dev
  ```

- **Production**

  ```bash
  npm start
  ```

- **MCP server (tools over stdio)**

  ```bash
  npm run mcp
  ```

## Environment variables

All config lives in `.env`. The example file `backend/.env.example` documents every variable. Key settings:

### OpenAI

- `OPENAI_API_KEY` – your OpenAI key (GPT‑4o or compatible model recommended)

### Google OAuth2

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN` *(for developer mode only)*
- `GMAIL_USER_EMAIL`

### Modes

- `DEVELOPER_MODE=true`
  - Single‑user flow
  - Uses `GMAIL_REFRESH_TOKEN` + `GMAIL_USER_EMAIL` from `.env`
- `DEVELOPER_MODE=false`
  - Multi‑user Google SSO
  - Users sign in via `/api/auth/google/start`
  - Refresh tokens are encrypted and stored in MongoDB

### Frontend + redirect

- `FRONTEND_URL` – frontend origin (default `http://localhost:5173`)
- `GOOGLE_REDIRECT_URI` – OAuth2 redirect URL (default `http://localhost:3001/api/auth/google/callback`)

### Storage & security

- `MONGODB_URI` – MongoDB connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/app?appName=...`). Required for the app to start.
- `TOKEN_ENCRYPTION_KEY` – strong secret for encrypting stored refresh tokens (use a 32‑byte base64 string or similar)

MongoDB collections: `users`, `google_tokens`, `sessions`, `chat_sessions`, `chat_messages`, `chat_metrics`, `user_settings`. All use auto-generated `_id` (ObjectId); `google_tokens` and `user_settings` also store `user_id` for one-doc-per-user lookups. Chat history is persisted for logged‑in users; the History panel in the UI lets users browse and reopen past conversations.

### Server

- `PORT` – HTTP + WebSocket port (default `3001`)

## API surface

High‑level HTTP and WebSocket endpoints:

- `GET /api/health` – health + configuration status

- **Chat**
  - `POST /api/chat` – send a message `{ message, sessionId }` to the orchestrator
  - `DELETE /api/chat/:sessionId` – clear a session (in‑memory + DB‑backed if logged in)

- **Chat history (DB‑backed, auth required)**
  - `GET /api/chat/sessions` – list chat sessions for the current user
  - `POST /api/chat/sessions` – create a new chat session
  - `GET /api/chat/sessions/:chatSessionId/messages` – get messages for a chat session
  - `PATCH /api/chat/sessions/:chatSessionId` – rename a chat session
  - `DELETE /api/chat/sessions/:chatSessionId` – delete a chat session

- **Auth**
  - `GET /api/auth/me` – current authenticated user
  - `POST /api/auth/logout` – logout
  - `GET /api/auth/google/start` – begin Google OAuth2 login
  - `GET /api/auth/google/callback` – OAuth2 callback

- **Evaluation metrics** (recorded only when the user submits feedback, e.g. thumbs up/down)
  - `POST /api/metrics/feedback` – record a metric with latency + optional rating/helpful/feedback for a chat session
  - `GET /api/metrics/summary` – summary stats (count, avg latency, avg rating) over feedbacked responses for the current user

- **MCP server config**
  - `GET /api/mcp/servers` – list configured MCP servers from `backend/mcp.config.json`
  - `POST /api/mcp/servers` – add or update an MCP server entry

- **WebSocket**
  - `WS /ws` – WebSocket chat stream with step‑by‑step traces from the orchestrator and sub‑agents

The frontend expects this backend to be reachable at `http://localhost:3001` by default (configurable via `VITE_API_URL` and `VITE_WS_URL` on the frontend).

## Running with the frontend

1. Start the backend:

   ```bash
   cd backend
   npm run dev
   ```

2. In another terminal, start the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

3. Open the UI at `http://localhost:5173` and start chatting.

## Code structure (backend)

Layout is split for reuse and clarity: config in one place, app factory for tests, routes mounted from a single module, MCP split into logger and tool registration.

```
src/
├── server.js              # Entry: preload → initDb → createApp → attach WS → listen
├── app.js                 # Express app factory (middleware + routes + error handler); reusable
├── preload.js             # Loads dotenv and disables OpenAI tracing before any SDK
├── config/
│   └── index.js           # Central config (port, frontendUrl, developerMode, logLevel, mongodbUri) from env
├── routes/
│   ├── index.js           # mountRoutes(app, options) – mounts all API routers
│   ├── healthRoutes.js    # GET /api/health
│   ├── chatRoutes.js      # /api/chat, /api/chat/sessions*
│   ├── metricsRoutes.js   # /api/metrics/*
│   ├── mcpRoutes.js       # /api/mcp/servers (list/update MCP config)
│   └── settingsRoutes.js  # /api/settings (user preferences, OpenAI key)
├── auth/
│   ├── session.js         # Cookie parsing, attachUser middleware
│   ├── googleRoutes.js    # Google OAuth2 start/callback, logout
│   ├── googleContext.js   # Resolve refresh token/email (developer vs multi-user)
│   └── requestContext.js  # AsyncLocalStorage for per-request context (used by MCP tools)
├── db/
│   ├── db.js              # Barrel: initDb, sessions, users, chat, metrics, settings
│   ├── client.js          # MongoDB client and indexes
│   ├── users.js           # Users + encrypted Google tokens
│   ├── authSessions.js    # Auth sessions (MongoDB)
│   ├── chatSessions.js    # chat_sessions, chat_messages
│   ├── metrics.js         # chat_metrics + summary
│   └── userSettings.js    # User settings (e.g. OpenAI key override)
├── agents/
│   ├── orchestrator.js    # Main orchestrator; delegates to sub-agents
│   ├── emailAgent.js      # Email tools (read/send/search)
│   ├── calendarAgent.js   # Calendar events
│   ├── tasksAgent.js      # Google Tasks
│   ├── newsAgent.js       # News headlines/search
│   └── searchAgent.js     # Web search
├── tools/
│   ├── registry.js        # Single source of truth: all tool defs (agent + MCP)
│   ├── emailTools.js      # Gmail implementations
│   ├── calendarTools.js   # Calendar API
│   ├── tasksTools.js      # Tasks API
│   ├── newsTools.js       # gnews
│   └── searchTools.js     # duck-duck-scrape
├── mcp/
│   ├── server.js          # MCP stdio entry: create server → registerAllTools → connect
│   ├── logger.js          # Stderr-only logger (blue ANSI) for MCP
│   ├── registerTools.js   # registerAllTools(server, log) – registry → MCP handlers
│   ├── client.js          # Spawns MCP server subprocess; callMcpTool() for agents
│   └── toolBridge.js      # Builds agent tools that forward execute() to MCP client
├── ws/
│   └── chatWsServer.js    # WebSocket /ws: streaming chat, orchestrator, tool calls
├── chat/
│   └── conversationMemory.js  # In-memory history for unauthenticated sessions
├── middleware/
│   └── rateLimit.js       # Per-user/IP rate limiting
└── utils/
    ├── index.js           # Barrel: toolResponse, helpers, googleAuth, emailHelpers
    ├── logger.js          # Structured logging (LOG_LEVEL)
    ├── openaiRun.js       # runAgent, resolveOpenAIConfig
    ├── googleAuth.js      # isEmailConfigured, isCalendarConfigured, etc.
    ├── toolResponse.js    # toolSuccess, toolError, toolEmpty
    ├── helpers.js         # clampMaxResults, formatNewsArticle, etc.
    ├── emailHelpers.js    # Gmail message helpers
    └── tokenCrypto.js     # Encrypt/decrypt stored refresh tokens
```

### Reuse

- **Config** – Import `config` from `./config/index.js` for port, frontendUrl, developerMode, logLevel, mongodbUri instead of reading `process.env` in multiple files.
- **App** – Use `createApp()` from `./app.js` in tests or alternate entry points; same middleware and routes without starting the HTTP server.
- **Routes** – All API routes are mounted from `routes/index.js` via `mountRoutes(app, options)`.
- **MCP** – Tool registration lives in `mcp/registerTools.js`; `mcp/server.js` stays a thin entry (create server, register tools, connect transport).

