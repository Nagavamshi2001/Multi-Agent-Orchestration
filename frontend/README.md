# Frontend – AI Agent Hub (Vue 3 + Vite)

This is the **chat UI** for the multi-agent orchestrator. It connects to the Node.js backend over **HTTP** and **WebSocket** to let you talk to the orchestrator and its sub‑agents (email, calendar, tasks, news, search, etc.).

## Prerequisites

- **Node.js** 18+ (same as backend)
- Backend server running (see backend README) – defaults to `http://localhost:3001`

## Installation

From the project root:

```bash
cd frontend
npm install
```

## Scripts

- **Development server**

  ```bash
  npm run dev
  ```

  - Default URL: `http://localhost:5173`
  - Hot module replacement (HMR) enabled

- **Production build**

  ```bash
  npm run build
  ```

- **Preview built app**

  ```bash
  npm run preview
  ```

## Configuration

The frontend talks to the backend using **Vite environment variables** (loaded from `.env` files).

- **HTTP API base URL**

  ```bash
  VITE_API_URL=http://localhost:3001
  ```

  - Used in `src/services/api.js` as `API_BASE`
  - Defaults to `http://localhost:3001` if not set

- **WebSocket URL**

  ```bash
  VITE_WS_URL=ws://localhost:3001/ws
  ```

  - Used for the live streaming assistant via WebSocket
  - Defaults to `ws://localhost:3001/ws` if not set

Create a `.env.local` (not committed) in `frontend/` if you want to override defaults:

```bash
VITE_API_URL=https://your-backend.example.com
VITE_WS_URL=wss://your-backend.example.com/ws
```

## How it works (high level)

- **ChatInterface.vue** – main orchestrator; composes sub‑components and manages state, WebSocket, and handlers.
- **ChatHeader.vue** – logo, auth (login/logout), History button, status pill, Clear button.
- **EmptyState.vue** – empty state with suggestion chips when there are no messages.
- **ChatInput.vue** – textarea and send button with auto‑resize.
- **MessageBubble.vue** – individual message with agent badge, traces, and markdown formatting.
- **LoginModal.vue** – sign‑in prompt with Google login.
- **HistoryDrawer.vue** – panel to browse, open, and manage past chat sessions (requires auth).
- **ErrorToast.vue** – dismissible error notification.
- **src/services/api.js** – Axios wrapper for backend (`/api/health`, `/api/chat`, `/api/chat/sessions/*`, `/api/auth/*`).
- A WebSocket connection streams messages and traces from the orchestrator in real time.

For overall system architecture, see the root `README.md`.
