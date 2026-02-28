# 🤖 Multi-Agent AI Orchestrator with Email Assistant

A production-quality multi-agent system powered by the **OpenAI Agents SDK** with a **Vue.js** chat interface. Integrates Gmail, Google Calendar, Google Tasks, news retrieval, and web search through natural language.

## Architecture

```
┌─────────────────────────────────────────┐
│           Vue.js Chat Interface          │  ← Port 5173
│     (Dark glassmorphism design)         │
└──────────────┬──────────────────────────┘
               │ HTTP REST / WebSocket
               ▼
┌───────────────────────────────────────────────────┐
│            Node.js Express Server                  │  ← Port 3001
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │            Orchestrator Agent               │   │
│  │      (Routes tasks to sub-agents)           │   │
│  └─────────────────┬──────────────────────────┘   │
│                    │ handoff()                    │
│      ┌─────┼─────┬─────┬─────┬─────┐              │
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

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Gmail API**, **Google Calendar API**, and **Google Tasks API**
3. Go to **Credentials** → Create **OAuth 2.0 Client ID** (type: Desktop App)
4. Note your `CLIENT_ID` and `CLIENT_SECRET`
5. Open [Google OAuth Playground](https://developers.google.com/oauthplayground/)
   - Click ⚙️ → Check "Use your own OAuth credentials" → Enter Client ID & Secret
   - In Step 1: Select `https://mail.google.com/`, `https://www.googleapis.com/auth/calendar`, and `https://www.googleapis.com/auth/tasks` → Authorize
   - In Step 2: Exchange code for tokens → Copy **Refresh token**
6. Paste values into `backend/.env`

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
| Frontend | Vue 3, Vite, Axios |
| Styling | Vanilla CSS (glassmorphism dark theme) |

---

📄 See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for full project documentation.
