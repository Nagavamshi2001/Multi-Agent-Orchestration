/**
 * Composable for app shell navigation: active view, sidebar open state, and labels.
 * Reusable across any layout that needs view switching.
 */
import { ref, computed } from 'vue';
import { NAV_ITEMS, VIEW_LABELS } from '../config/index.js';

export function useNavigation(initialView = 'chat') {
  const activeView = ref(initialView);
  const sidebarOpen = ref(false);

  const activeViewLabel = computed(() => VIEW_LABELS[activeView.value] ?? activeView.value);

  function setActiveView(id) {
    activeView.value = id;
  }

  function selectView(id) {
    setActiveView(id);
    sidebarOpen.value = false;
  }

  return {
    navItems: NAV_ITEMS,
    activeView,
    sidebarOpen,
    activeViewLabel,
    setActiveView,
    selectView,
  };
}
