# Frontend – AI Agent Hub (Vue 3 + Vite)

This is the **world-class chat UI** for the multi-agent orchestrator, built with a sleek "Neon & Cyber" aesthetic. It connects to the Node.js backend over **HTTP** and **WebSocket** to let you talk to the orchestrator and its sub‑agents (email, calendar, tasks, **YouTube & music**, news, search, etc.). 

Key UX/UI features:
- **Persistent Sidebar**: Manages chat history, integrations, settings, and user profile.
- **Thought Process Trace**: An elegant, animated accordion showing the exact steps the AI takes.
- **Rich Media Cards**: Video and document results display as beautiful glassmorphism cards.
- **Inline YouTube Player**: Videos play directly inline within the chat stream, rather than in jarring modals. (Auto-opens and autoplays if you ask to "play" a video or song).

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

- **HTTP API base URL** – `VITE_API_URL` (default `http://localhost:3001`). Read from `src/config/index.js` as `API_BASE`; used by the API client and ChatInterface.
- **WebSocket URL** – `VITE_WS_URL` (default `ws://localhost:3001/ws`). Used for the live streaming chat; exported as `WS_URL` / `WS_BASE` from config and services.

Create a `.env.local` (not committed) in `frontend/` if you want to override defaults:

```bash
VITE_API_URL=https://your-backend.example.com
VITE_WS_URL=wss://your-backend.example.com/ws
```

## Code structure (frontend)

Layout is split into config, composables, layout components, icons, and modular services so views and API calls are reusable and easy to test.

```
src/
├── main.js                 # Vue app entry; mounts App
├── App.vue                 # Root: AppHeader, main (Chat | Integrations | Settings), SidebarMenu; uses useNavigation
├── config/
│   └── index.js            # NAV_ITEMS, VIEW_IDS, VIEW_LABELS, API_BASE, WS_URL (from env)
├── composables/
│   ├── useNavigation.js   # activeView, sidebarOpen, activeViewLabel, navItems, selectView
│   └── useWebSocketChat.js # connectWebSocket, sendMessage; handles trace/response/error, updates messages/sessionId/isLoading/error; onOpen, onClose, onResponse callbacks
├── utils/
│   ├── index.js            # Barrel: messageUtils, formatUtils, agentDisplay
│   ├── messageUtils.js     # createMessage, mapDbMessageToUI, findLastMessageByRole, shouldAutoPlayFirst
│   ├── formatUtils.js      # formatMessageTime, formatMarkdown (simple markdown → HTML)
│   └── agentDisplay.js     # getAgentIcon (emoji by agent), getTraceIcon (emoji by trace step)
├── components/
│   ├── layout/
│   │   ├── index.js        # Barrel: AppHeader, SidebarMenu, StatusPill
│   │   ├── AppHeader.vue   # Logo, title, user pill, History, StatusPill, Clear; emits login/logout/toggleHistory/clear
│   │   ├── SidebarMenu.vue # Slide-out nav (Chat, Integrations, Settings); v-model open, @select
│   │   └── StatusPill.vue  # Reusable status indicator (ok | error | warning | checking)
│   ├── icons/
│   │   ├── index.js        # Barrel: IconMenu, IconClose, IconChat, IconIntegrations, IconSettings
│   │   ├── IconMenu.vue    # Hamburger menu SVG
│   │   ├── IconClose.vue   # Close (X) SVG
│   │   ├── IconChat.vue    # Chat bubble SVG
│   │   ├── IconIntegrations.vue
│   │   └── IconSettings.vue
│   ├── ChatInterface.vue   # Messages list, ChatInput; uses useWebSocketChat, messageUtils (createMessage, mapDbMessageToUI); history drawer, login modal, error toast
│   ├── ChatInput.vue       # Textarea + send; auto-resize
│   ├── MessageBubble.vue   # Agent badge, ThinkingIndicator, content (formatMarkdown), YouTubeVideoList, ExecutionTrace, latency, FeedbackControls
│   ├── ThinkingIndicator.vue # "Analyzing..." state with dot + thought/agent name (used while assistant is loading)
│   ├── ExecutionTrace.vue  # Collapsible execution flow (trace steps with icons)
│   ├── YouTubeVideoList.vue # Video cards grid + modal player (embed); autoPlayFirst to open and autoplay first video
│   ├── EmptyState.vue      # Empty state with suggestion chips
│   ├── FeedbackControls.vue # Thumbs up/down; on submit sends to POST /api/metrics/feedback (metrics recorded only when user gives feedback)
│   ├── LoginModal.vue      # Sign-in prompt with Google login
│   ├── HistoryDrawer.vue   # List/open/delete chat sessions (auth required)
│   ├── ErrorToast.vue      # Dismissible error message
│   ├── IntegrationsPanel.vue # MCP / integrations view
│   ├── SettingsPanel.vue   # User settings (e.g. OpenAI key, model)
│   └── McpServersDrawer.vue # MCP server list/edit (if used)
├── services/
│   ├── api.js              # Barrel: re-exports all (backwards compatible)
│   ├── apiClient.js        # Axios instance; API_BASE, WS_URL from config
│   ├── auth.js             # getMe, logout
│   ├── chat.js             # checkHealth, sendMessage, clearSession, listChatSessions, createChatSession, getChatSessionMessages, renameChatSession, deleteChatSession
│   ├── metrics.js          # sendMetricsFeedback (called when user clicks thumbs up/down), getMetricsSummary
│   ├── mcp.js              # getMcpServers, saveMcpServer
│   ├── settings.js         # getSettings, saveSettings
│   └── index.js            # Same exports as api.js for import from '@/services'
└── assets/
    └── main.css            # Global CSS variables and base styles
```

### Reuse

- **Config** – Use `API_BASE`, `WS_URL`, `NAV_ITEMS`, `VIEW_LABELS` from `@/config` (or `./config/index.js`) instead of reading `import.meta.env` in multiple places.
- **Composables** – `useNavigation()` for view state and sidebar; `useWebSocketChat(messagesRef, sessionIdRef, isLoadingRef, errorRef, { onOpen, onClose, onResponse })` for WebSocket chat (connect, send, handle trace/response/error).
- **Utils** – `messageUtils` (createMessage, mapDbMessageToUI, shouldAutoPlayFirst), `formatUtils` (formatMessageTime, formatMarkdown), `agentDisplay` (getAgentIcon, getTraceIcon). Import from `@/utils` or `../utils/index.js`.
- **Layout** – `AppHeader`, `SidebarMenu`, and `StatusPill` are reusable; pass props and listen to emits.
- **Services** – Import from `@/services/api.js` (barrel) or from `@/services/chat`, `@/services/auth`, etc. for smaller bundles and clearer dependencies.

For overall system architecture, see the root `README.md`.
