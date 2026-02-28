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
  - Refresh tokens are encrypted and stored in a local SQLite DB

### Frontend + redirect

- `FRONTEND_URL` – frontend origin (default `http://localhost:5173`)
- `GOOGLE_REDIRECT_URI` – OAuth2 redirect URL (default `http://localhost:3001/api/auth/google/callback`)

### Storage & security

- `DB_PATH` – path to the SQLite DB file (default `./data/app.sqlite`)
- `TOKEN_ENCRYPTION_KEY` – strong secret for encrypting stored refresh tokens (use a 32‑byte base64 string or similar)

The SQLite DB stores: `users`, `google_tokens`, auth `sessions`, `chat_sessions`, and `chat_messages`. Chat history is persisted for logged‑in users; the History panel in the UI lets users browse and reopen past conversations.

### Server

- `PORT` – HTTP + WebSocket port (default `3001`)

## API surface

High‑level HTTP and WebSocket endpoints:

- `GET /api/health` – health + configuration status
- `POST /api/chat` – send a message `{ message, sessionId }`
- `DELETE /api/chat/:sessionId` – clear a session
- `GET /api/chat/sessions` – list chat sessions (auth required)
- `POST /api/chat/sessions` – create chat session
- `GET /api/chat/sessions/:chatSessionId/messages` – get messages for a session
- `PATCH /api/chat/sessions/:chatSessionId` – rename session
- `DELETE /api/chat/sessions/:chatSessionId` – delete session
- `GET /api/auth/me` – current authenticated user
- `POST /api/auth/logout` – logout
- `GET /api/auth/google/start` – begin Google OAuth2 login
- `GET /api/auth/google/callback` – OAuth2 callback
- `WS /ws` – WebSocket chat stream

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

Key backend modules:

- `src/server.js` – Express app setup, middleware, auth routes, REST chat + history routes, and WebSocket server bootstrap.
- `src/agents/` – orchestrator and sub‑agents (email, calendar, tasks, news, search).
- `src/db/client.js` – SQLite (sql.js) initialization, schema, and low‑level helpers.
- `src/db/users.js` – user rows and encrypted Google tokens.
- `src/db/authSessions.js` – auth sessions (`sessions` table) for login cookies.
- `src/db/chatSessions.js` – chat history tables (`chat_sessions`, `chat_messages`).
- `src/db/db.js` – barrel file re‑exporting the DB API (existing imports keep working).
- `src/auth/googleRoutes.js` – Google OAuth2 login, callback, logout.
- `src/auth/googleContext.js` – resolves the correct Google refresh token/email based on `DEVELOPER_MODE` and the current user.
- `src/auth/session.js` – cookie parsing and `req.user` attachment.
- `src/chat/conversationMemory.js` – in‑memory short history for unauthenticated sessions.
- `src/ws/chatWsServer.js` – WebSocket `/ws` server with streaming traces and integration with the orchestrator.

