# 🤖 Multi-Agent AI Orchestrator with Email Assistant

**Current release:** `v1.0.0`

A production-quality multi-agent system powered by the **OpenAI Agents SDK** with a **Vue.js** chat interface. Integrates Gmail, Google Calendar, Google Tasks, news retrieval, and web search through natural language.

## Architecture

```
┌─────────────────────────────────────────┐
│           Vue.js Chat Interface          │  ← Port 5173
│  (Dark glassmorphism, History panel)    │
└──────────────┬──────────────────────────┘
               │ HTTP REST / WebSocket
               ▼
┌───────────────────────────────────────────────────┐
│            Node.js Express Server                  │  ← Port 3001
│  ┌─────────────────────────────────────────────┐ │
│  │  SQLite (sql.js) — users, chat_sessions,     │ │
│  │  chat_messages (persistent history)          │ │
│  └─────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │            Orchestrator Agent               │ │
│  │      (Routes tasks to sub-agents)           │ │
│  └─────────────────┬──────────────────────────┘ │
│                    │ handoff()                   │
│      ┌─────┼─────┬─────┬─────┬─────┐             │
│      ▼     ▼     ▼     ▼     ▼                   │
│  ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│  │📧 Email  ││📅Calendar││✅ Tasks  ││📰 News   ││🔍 Search │
│  └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
└───────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 18+
- OpenAI API key (GPT-4o or GPT-4-turbo)
- Gmail OAuth2 credentials (for email, calendar, tasks — add all scopes)

## Quick Start

### 1. Clone & set up Backend

```bash
git clone <repo-url>
cd backend
npm install
cp .env.example .env   # Then edit .env with your keys
```

> **Note:** `.env` is gitignored — never commit API keys or OAuth tokens. Use `.env.example` as a template.

Edit `backend/.env`:
```env
OPENAI_API_KEY=sk-your-actual-openai-key
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
GMAIL_USER_EMAIL=you@gmail.com
```

### 2. Set up Frontend

```bash
cd frontend
npm install
```

### 3. Run (two terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Google OAuth2 Setup

This project supports **two modes**:

### Mode A — Developer Mode (single account via `.env`)

- Set `DEVELOPER_MODE=true` in `backend/.env`
- Use OAuth Playground to generate one refresh token and store:
  - `GMAIL_CLIENT_ID`
  - `GMAIL_CLIENT_SECRET`
  - `GMAIL_REFRESH_TOKEN`
  - `GMAIL_USER_EMAIL`

### Mode B — Multi-user Google SSO (recommended)

- Set `DEVELOPER_MODE=false`
- Users click **Login** in the UI, which starts OAuth at `/api/auth/google/start`
- The server stores each user’s refresh token in a **local SQLite file** (`DB_PATH`) encrypted using `TOKEN_ENCRYPTION_KEY`

#### Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Gmail API**, **Google Calendar API**, and **Google Tasks API**
3. Go to **Credentials** → Create **OAuth 2.0 Client ID**
4. Set these in `backend/.env`:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `FRONTEND_URL` (default `http://localhost:5173`)
   - `TOKEN_ENCRYPTION_KEY` (strong secret)
   - `DB_PATH` (default `./data/app.sqlite`)

---

## Example Prompts

| Prompt | Agent Used |
|--------|-----------|
| "Read my unread emails" | 📧 Email Assistant |
| "Send an email to john@example.com with subject Hello and body Hi there" | 📧 Email Assistant |
| "Search for emails from Amazon" | 📧 Email Assistant |
| "What's on my calendar?" | 📅 Calendar Assistant |
| "Schedule a meeting tomorrow at 3pm called Team Standup" | 📅 Calendar Assistant |
| "Show my tasks" | ✅ Tasks Assistant |
| "Add task Buy groceries" | ✅ Tasks Assistant |
| "What's the latest news?" | 📰 News Assistant |
| "Search news about AI" | 📰 News Assistant |
| "Tech news today" | 📰 News Assistant |
| "Search for node.js tutorials" | 🔍 Search Assistant |
| "Look up the capital of France" | 🔍 Search Assistant |
| "What can you help me with?" | 🤖 Orchestrator (direct) |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Server + agent status |
| `POST` | `/api/chat` | Send a message `{ message, sessionId }` |
| `DELETE` | `/api/chat/:sessionId` | Clear session history |
| `GET` | `/api/chat/sessions` | List chat sessions (auth required) |
| `POST` | `/api/chat/sessions` | Create chat session |
| `GET` | `/api/chat/sessions/:id/messages` | Get messages for a session |
| `PATCH` | `/api/chat/sessions/:id` | Rename session |
| `DELETE` | `/api/chat/sessions/:id` | Delete session |
| `WS` | `/ws` | WebSocket chat connection |

---

## Adding More Sub-Agents

1. Create `backend/src/agents/<name>Agent.js` (model it after `emailAgent.js` or `calendarAgent.js`)
2. Import and add it to the `handoffs` array in `backend/src/agents/orchestrator.js`
3. Update the orchestrator's system instructions to mention the new agent

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| AI Agents | OpenAI Agents SDK (`@openai/agents`), GPT-4o |
| Google APIs | Gmail, Calendar, Tasks (OAuth2) |
| News | gnews (Google News RSS) |
| Web Search | duck-duck-scrape |
| Backend | Node.js, Express, WebSocket (ws) |
| Database | SQLite (sql.js) — users, auth sessions, chat_sessions, chat_messages |
| Frontend | Vue 3, Vite, Axios |
| Styling | Vanilla CSS (glassmorphism dark theme) |

---

📄 See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for full project documentation.
