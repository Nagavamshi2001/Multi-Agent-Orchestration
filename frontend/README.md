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

- `ChatInterface.vue` renders the main chat layout, quick suggestions, login/logout, and error toasts.
- `src/services/api.js` wraps Axios calls to the backend (`/api/health`, `/api/chat`, `/api/auth/*`).
- A WebSocket connection streams messages and traces from the orchestrator in real time.

For overall system architecture, see the root `README.md`.
