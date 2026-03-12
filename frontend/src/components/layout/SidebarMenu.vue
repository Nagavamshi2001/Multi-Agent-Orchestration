<template>
  <aside 
    class="sidebar glass"
    :class="{ 'sidebar-collapsed': isCollapsed }"
  >
    <div class="sidebar-header">
      <router-link to="/" class="logo-link" :class="{ 'collapsed': isCollapsed }">
        <div class="shell-logo-orb">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <div class="shell-titles" v-if="!isCollapsed">
          <h1 class="shell-title">Agent Hub</h1>
        </div>
      </router-link>
      <button class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
        <svg v-if="!isCollapsed" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>
    </div>

    <!-- New Chat Button -->
    <div class="sidebar-new-chat">
      <button class="btn-new-chat" @click="handleNewChat" :class="{ 'collapsed': isCollapsed }">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span v-if="!isCollapsed">New Chat</span>
      </button>
    </div>

    <!-- Chat History -->
    <div class="sidebar-history" v-if="!isCollapsed">
      <div v-if="loading" class="history-loading">
        <div class="skeleton-item" style="width: 100%"></div>
        <div class="skeleton-item" style="width: 80%"></div>
        <div class="skeleton-item" style="width: 90%"></div>
        <div class="skeleton-item" style="width: 70%"></div>
      </div>
      <div v-else-if="sessions.length === 0" class="history-empty">
        No chats yet
      </div>
      <div v-else class="history-list">
        <div v-if="groupedSessions.today.length > 0" class="history-group">
          <div class="history-group-label">Today</div>
          <button
            v-for="s in groupedSessions.today"
            :key="s.id"
            class="history-item"
            :class="{ active: s.id === activeSessionId }"
            @click="handleOpenSession(s.id)"
          >
            <svg class="history-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="history-title">{{ s.title || 'Untitled chat' }}</span>
          </button>
        </div>
        
        <div v-if="groupedSessions.previous7Days.length > 0" class="history-group">
          <div class="history-group-label">Previous 7 Days</div>
          <button
            v-for="s in groupedSessions.previous7Days"
            :key="s.id"
            class="history-item"
            :class="{ active: s.id === activeSessionId }"
            @click="handleOpenSession(s.id)"
          >
            <svg class="history-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="history-title">{{ s.title || 'Untitled chat' }}</span>
          </button>
        </div>

        <div v-if="groupedSessions.older.length > 0" class="history-group">
          <div class="history-group-label">Older</div>
          <button
            v-for="s in groupedSessions.older"
            :key="s.id"
            class="history-item"
            :class="{ active: s.id === activeSessionId }"
            @click="handleOpenSession(s.id)"
          >
            <svg class="history-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="history-title">{{ s.title || 'Untitled chat' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation & Footer -->
    <div class="sidebar-footer">
      <nav class="sidebar-nav">
        <router-link
          v-for="item in bottomNavItems"
          :key="item.id"
          :to="getRoutePath(item.id)"
          class="menu-item"
          active-class="active"
          :title="isCollapsed ? item.label : ''"
        >
          <span class="menu-icon" aria-hidden="true">
            <IconIntegrations v-if="item.id === 'integrations'" />
            <IconSettings v-else-if="item.id === 'settings'" />
          </span>
          <span class="menu-text" v-if="!isCollapsed">{{ item.label }}</span>
        </router-link>
      </nav>

      <div v-if="!user" class="auth-section">
        <button type="button" class="btn-login" @click="$emit('login');">
          <span v-if="!isCollapsed">Login</span>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
        </button>
      </div>
      <div v-else class="user-menu-container">
        <button class="user-profile-btn" @click="toggleUserMenu" :class="{ active: showUserMenu, collapsed: isCollapsed }">
          <img v-if="user.picture" :src="user.picture" class="user-avatar" alt="User avatar" />
          <div v-else class="user-avatar-placeholder">
            {{ getUserInitials(user) }}
          </div>
          <div class="user-info" v-if="!isCollapsed">
            <span class="user-name-short">{{ getUserName(user) }}</span>
            <span class="user-email-short">{{ user.email }}</span>
          </div>
        </button>

        <div v-if="showUserMenu" class="user-dropdown-menu" :class="{ 'dropdown-collapsed': isCollapsed }">
          <button class="menu-item-dropdown" @click="openSettings">
            <IconSettings class="menu-icon-small" />
            <span v-if="!isCollapsed">Settings</span>
          </button>
          <div class="menu-divider"></div>
          <button class="menu-item-dropdown danger" @click="logout">
            <svg class="menu-icon-small" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span v-if="!isCollapsed">Logout</span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import IconIntegrations from '../icons/IconIntegrations.vue';
import IconSettings from '../icons/IconSettings.vue';

const props = defineProps({
  navItems: { type: Array, required: true },
  user: { type: Object, default: null },
  sessions: { type: Array, default: () => [] },
  activeSessionId: { type: String, default: '' },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['login', 'logout', 'open-session', 'new-chat']);
const router = useRouter();

const isCollapsed = ref(false);
const showUserMenu = ref(false);

const bottomNavItems = computed(() => {
  return props.navItems.filter(item => item.id !== 'chat');
});

const groupedSessions = computed(() => {
  const groups = { today: [], previous7Days: [], older: [] };
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

  for (const s of props.sessions) {
    const ts = s.updated_at || s.created_at;
    if (!ts) continue;
    if (ts >= todayStart) groups.today.push(s);
    else if (ts >= sevenDaysAgo) groups.previous7Days.push(s);
    else groups.older.push(s);
  }
  return groups;
});

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  showUserMenu.value = false;
};

const handleNewChat = () => {
  emit('new-chat');
  router.push('/');
};

const handleOpenSession = (id) => {
  emit('open-session', id);
  router.push('/');
};

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const closeUserMenu = (e) => {
  if (showUserMenu.value && !e.target.closest('.user-menu-container')) {
    showUserMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeUserMenu);
});
onUnmounted(() => {
  document.removeEventListener('click', closeUserMenu);
});

function getRoutePath(id) {
  if (id === 'integrations') return '/integrations';
  if (id === 'settings') return '/settings';
  return '/';
}

const getUserInitials = (user) => {
  if (!user || !user.name) return 'U';
  return user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};
const getUserName = (user) => {
  if (!user || !user.name) return 'User';
  return user.name.split(' ')[0];
};
const openSettings = () => {
  showUserMenu.value = false;
  router.push('/settings');
};
const logout = () => {
  showUserMenu.value = false;
  emit('logout');
};
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  gap: 16px;
  flex-shrink: 0;
  z-index: 50;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden; /* Ensure sidebar itself doesn't cause page scroll */
}
.sidebar.sidebar-collapsed {
  width: 72px;
  padding: 16px 8px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  height: 40px; /* Increased height for breathing room */
}
.sidebar-collapsed .sidebar-header {
  flex-direction: column;
  height: auto;
  gap: 16px;
  padding-top: 8px;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;
}
.logo-link.collapsed {
  justify-content: center;
  width: 100%;
}
.logo-link:hover { opacity: 0.85; }
.shell-logo-orb {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
}
.shell-title {
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.02em;
}

.collapse-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}
.collapse-btn:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}

.sidebar-new-chat {
  padding: 0 4px;
}
.btn-new-chat {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--color-text);
  color: var(--color-bg);
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, filter 0.2s;
  justify-content: flex-start;
}
.btn-new-chat.collapsed {
  justify-content: center;
  padding: 10px;
}
.btn-new-chat:hover {
  filter: brightness(0.9);
  transform: translateY(-1px);
}

.sidebar-history {
  flex: 1 1 0; /* Add flex-basis 0 to strictly force shrink */
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 4px 16px 4px;
  
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s;
}
.sidebar-history:hover {
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

/* Webkit (Chrome, Edge, Safari) */
.sidebar-history::-webkit-scrollbar {
  width: 4px;
}
.sidebar-history::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-history::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 4px;
  transition: background-color 0.3s;
}
.sidebar-history:hover::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.15);
}
.sidebar-history::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* Ensure the inner list can't overflow horizontally to trigger weird flex calculations */
  max-width: 100%;
}

.history-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.history-group-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 4px 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.history-item {
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}
.history-icon {
  flex-shrink: 0;
  opacity: 0.7;
}
.history-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%);
  mask-image: linear-gradient(to right, black 80%, transparent 100%);
}
.history-item:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}
.history-item.active {
  background: var(--color-surface-2);
  color: var(--color-text);
  font-weight: 500;
  box-shadow: inset 3px 0 0 var(--color-text);
}

.history-empty, .history-loading {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  padding: 12px 8px;
}
.skeleton-item {
  height: 24px;
  border-radius: 4px;
  background: var(--color-surface-2);
  margin-bottom: 6px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 4px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  transition: var(--transition);
}
.sidebar-collapsed .menu-item {
  justify-content: center;
  padding: 10px;
}
.menu-item:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}
.menu-item.active {
  background: var(--color-surface-2);
  color: var(--color-text);
  font-weight: 500;
}

.btn-login {
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-login:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-menu-container {
  position: relative;
  width: 100%;
}
.user-profile-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}
.user-profile-btn.collapsed {
  justify-content: center;
}
.user-profile-btn:hover, .user-profile-btn.active {
  background: var(--color-surface-2);
}
.user-avatar, .user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}
.user-avatar-placeholder {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
}
.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.user-name-short {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-email-short {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  width: 220px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  padding: 6px;
  animation: slideUp 0.15s ease-out;
}
.user-dropdown-menu.dropdown-collapsed {
  left: calc(100% + 8px);
  bottom: 0;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-item-dropdown {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.menu-item-dropdown:hover {
  background: var(--color-surface-2);
}
.menu-item-dropdown.danger {
  color: var(--color-error);
}
.menu-item-dropdown.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}
.menu-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}
</style>
