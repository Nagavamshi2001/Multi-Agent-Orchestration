import { ref } from 'vue';

export const globalHistorySessions = ref([]);
export const globalHistoryLoading = ref(false);
export const globalSessionId = ref(localStorage.getItem('sk_session_id') || `session_${Date.now()}`);
