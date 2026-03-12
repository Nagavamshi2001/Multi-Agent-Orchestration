<template>
  <div class="avatar-icon-wrapper" :class="[type, { 'is-agent': type !== 'user' }]">
    <!-- User -->
    <svg v-if="type === 'user'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg user-icon">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>

    <!-- Email -->
    <svg v-else-if="type === 'email'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg email-icon">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>

    <!-- Calendar -->
    <svg v-else-if="type === 'calendar'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg cal-icon">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>

    <!-- YouTube / Video -->
    <svg v-else-if="type === 'youtube'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg yt-icon">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.18 1 12 1 12s0 3.82.46 5.58a2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.82 23 12 23 12s0-3.82-.46-5.58z"></path>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
    </svg>

    <!-- Docs -->
    <svg v-else-if="type === 'docs'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg docs-icon">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>

    <!-- Sheets / Charts -->
    <svg v-else-if="type === 'sheets'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg sheets-icon">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="3" y1="15" x2="21" y2="15"></line>
      <line x1="9" y1="9" x2="9" y2="21"></line>
      <line x1="15" y1="9" x2="15" y2="21"></line>
    </svg>

    <!-- Tasks -->
    <svg v-else-if="type === 'tasks'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg tasks-icon">
      <polyline points="9 11 12 14 22 4"></polyline>
      <path d="M21 12v7a2 2 0 0 1 2-2h11"></path>
    </svg>

    <!-- News -->
    <svg v-else-if="type === 'news'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg news-icon">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
      <path d="M18 14h-8"></path>
      <path d="M15 18h-5"></path>
      <path d="M10 6h8v4h-8V6Z"></path>
    </svg>

    <!-- Search -->
    <svg v-else-if="type === 'search'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg search-icon">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>

    <!-- Orchestrator -->
    <svg v-else-if="type === 'orchestrator'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg orchestrator-icon">
      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
      <path d="M2 17l10 5 10-5"></path>
      <path d="M2 12l10 5 10-5"></path>
    </svg>

    <!-- Default AI / Agent -->
    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg ai-icon">
      <rect x="3" y="11" width="18" height="10" rx="2"></rect>
      <circle cx="12" cy="5" r="2"></circle>
      <path d="M12 7v4"></path>
      <line x1="8" y1="16" x2="8" y2="16"></line>
      <line x1="16" y1="16" x2="16" y2="16"></line>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'default',
  }
});
</script>

<style scoped>
.avatar-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.icon-svg {
  width: 18px;
  height: 18px;
  color: inherit;
}

.avatar-icon-wrapper.is-agent .icon-svg {
  width: 20px;
  height: 20px;
}

/* Distinct subtle colors for different agent types to give a world-class look */
.user-icon {
  color: var(--color-text-muted);
}
.email-icon {
  color: #38bdf8; /* Light blue */
}
.cal-icon {
  color: #f472b6; /* Pink/Red */
}
.yt-icon {
  color: #ef4444; /* YouTube Red */
}
.docs-icon {
  color: #60a5fa; /* Docs Blue */
}
.sheets-icon {
  color: #34d399; /* Sheets Green */
}
.tasks-icon {
  color: #fbbf24; /* Amber */
}
.news-icon {
  color: #f87171; /* Red/Orange */
}
.search-icon {
  color: #c084fc; /* Purple */
}
.orchestrator-icon {
  color: #818cf8; /* Deep Purple */
}
.ai-icon {
  color: #a78bfa; /* Default AI Indigo */
}
</style>
