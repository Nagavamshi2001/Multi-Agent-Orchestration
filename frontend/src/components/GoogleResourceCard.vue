<template>
  <a
    :href="resourceLink"
    target="_blank"
    rel="noopener noreferrer"
    class="google-resource-card"
  >
    <span class="resource-icon" aria-hidden="true">{{ resourceIcon }}</span>
    <div class="resource-info">
      <span class="resource-title">{{ item.name || 'Untitled' }}</span>
      <span v-if="formattedDate" class="resource-date">{{ formattedDate }}</span>
    </div>
    <span class="resource-open">Open ↗</span>
  </a>
</template>

<script setup>
import { computed } from 'vue';
import { formatDriveItemDate } from '../utils/driveDisplay.js';

const props = defineProps({
  item: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  resourceType: {
    type: String,
    default: 'doc',
    validator: (v) => ['doc', 'sheet'].includes(v),
  },
});

const resourceLink = computed(() => {
  const i = props.item;
  return i.webViewLink || i.documentUrl || i.spreadsheetUrl || '#';
});

const resourceIcon = computed(() => (props.resourceType === 'sheet' ? '📊' : '📄'));

const formattedDate = computed(() => formatDriveItemDate(props.item.modifiedTime));
</script>

<style scoped>
.google-resource-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-lg, 8px);
  background: var(--color-surface-2, #1e293b);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
  color: var(--color-text, #e2e8f0);
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;
}

.google-resource-card:hover {
  background: var(--color-surface-3, #334155);
  border-color: var(--color-primary, #6366f1);
}

.resource-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.resource-title {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-date {
  font-size: 0.72rem;
  color: var(--color-text-muted, #94a3b8);
}

.resource-open {
  font-size: 0.75rem;
  color: var(--color-primary, #6366f1);
  flex-shrink: 0;
}
</style>
