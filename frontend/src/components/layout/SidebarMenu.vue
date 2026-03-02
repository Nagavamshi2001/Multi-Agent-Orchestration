<template>
  <Transition name="menu-pop">
    <div v-if="modelValue" class="menu-backdrop" @click.self="$emit('update:modelValue', false)">
      <aside class="menu-popover glass" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="menu-header">
          <div class="menu-title">Menu</div>
          <button type="button" class="icon-btn" @click="$emit('update:modelValue', false)" aria-label="Close menu">
            <IconClose />
          </button>
        </div>
        <nav class="menu-nav">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="menu-item"
            :class="{ active: activeView === item.id }"
            @click="$emit('select', item.id)"
          >
            <span class="menu-icon" aria-hidden="true">
              <IconChat v-if="item.id === 'chat'" />
              <IconIntegrations v-else-if="item.id === 'integrations'" />
              <IconSettings v-else />
            </span>
            <span class="menu-text">{{ item.label }}</span>
          </button>
        </nav>
        <div class="menu-footer">
          <div class="menu-hint">Workspace assistant</div>
        </div>
      </aside>
    </div>
  </Transition>
</template>

<script setup>
import IconClose from '../icons/IconClose.vue';
import IconChat from '../icons/IconChat.vue';
import IconIntegrations from '../icons/IconIntegrations.vue';
import IconSettings from '../icons/IconSettings.vue';

defineProps({
  modelValue: Boolean,
  navItems: { type: Array, required: true },
  activeView: { type: String, required: true },
});
defineEmits(['update:modelValue', 'select']);
</script>

<style scoped>
.menu-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.25);
  z-index: 90;
}
.menu-popover {
  position: fixed;
  top: 74px;
  left: 18px;
  width: min(320px, 88vw);
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.98));
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.75);
  padding: 12px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 0;
}
.menu-title {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.75);
}
.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.25);
  color: rgba(226, 232, 240, 0.85);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}
.icon-btn:hover {
  background: rgba(148, 163, 184, 0.14);
}
.menu-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 2px 0;
}
.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.35);
  color: rgba(226, 232, 240, 0.82);
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
}
.menu-item:hover {
  border-color: rgba(129, 140, 248, 0.55);
  background: rgba(99, 102, 241, 0.12);
}
.menu-item.active {
  border-color: rgba(129, 140, 248, 0.75);
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.25), rgba(129, 140, 248, 0.16));
  box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.35);
}
.menu-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.16);
  color: rgba(226, 232, 240, 0.92);
  flex: 0 0 auto;
}
.menu-text {
  font-size: 0.9rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}
.menu-footer {
  margin-top: auto;
  padding: 10px 10px 2px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}
.menu-hint {
  font-size: 0.76rem;
  color: rgba(148, 163, 184, 0.85);
}
.menu-pop-enter-active,
.menu-pop-leave-active {
  transition: opacity 0.16s ease;
}
.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
}
.menu-pop-enter-active .menu-popover,
.menu-pop-leave-active .menu-popover {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.menu-pop-enter-from .menu-popover {
  transform: translateY(-6px) scale(0.985);
  opacity: 0;
}
.menu-pop-leave-to .menu-popover {
  transform: translateY(-6px) scale(0.985);
  opacity: 0;
}
</style>
