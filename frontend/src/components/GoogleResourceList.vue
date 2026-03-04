<template>
  <div class="google-resource-list">
    <GoogleResourceCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      :resource-type="resourceType"
    />
  </div>
</template>

<script setup>
import GoogleResourceCard from './GoogleResourceCard.vue';

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  resourceType: {
    type: String,
    default: 'doc',
    validator: (v) => ['doc', 'sheet'].includes(v),
  },
});
</script>

<style scoped>
.google-resource-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  width: 100%;
}
</style>
