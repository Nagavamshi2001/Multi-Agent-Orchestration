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

### Server

- `PORT` – HTTP + WebSocket port (default `3001`)

## API surface

High‑level HTTP and WebSocket endpoints:

- `GET /api/health` – health + configuration status
- `POST /api/chat` – send a message `{ message, sessionId }`
- `DELETE /api/chat/:sessionId` – clear a session
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

