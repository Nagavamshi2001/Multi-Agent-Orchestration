<template>
  <div class="youtube-video-list">
    <div class="video-grid">
      <button
        v-for="video in videos"
        :key="video.id"
        type="button"
        class="video-card"
        @click="openPlayer(video)"
      >
        <div class="video-thumb">
          <img
            v-if="video.thumbnailUrl"
            :src="video.thumbnailUrl"
            :alt="video.title"
            loading="lazy"
          />
          <span v-else class="no-thumb">No thumbnail</span>
          <span class="play-icon" aria-hidden="true">▶</span>
        </div>
        <div class="video-info">
          <span class="video-title">{{ video.title || 'Untitled' }}</span>
          <span v-if="video.channelTitle" class="video-channel">{{ video.channelTitle }}</span>
        </div>
      </button>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="activeVideo"
          class="video-modal-overlay"
          @click.self="closePlayer"
        >
          <div class="video-modal">
            <button type="button" class="modal-close" aria-label="Close" @click="closePlayer">×</button>
            <div class="video-modal-content">
              <iframe
                :src="embedUrl"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              />
              <div class="video-modal-meta">
                <span class="video-modal-title">{{ activeVideo.title }}</span>
                <a
                  :href="watchUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="open-youtube-link"
                >
                  Open in YouTube ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  videos: {
    type: Array,
    default: () => [],
  },
  autoPlayFirst: {
    type: Boolean,
    default: false,
  },
});

const activeVideo = ref(null);

const embedUrl = computed(() => {
  if (!activeVideo.value?.id) return '';
  const autoplay = props.autoPlayFirst ? 1 : 0;
  return `https://www.youtube.com/embed/${activeVideo.value.id}?autoplay=${autoplay}`;
});

const watchUrl = computed(() => {
  if (!activeVideo.value?.id) return '#';
  return `https://www.youtube.com/watch?v=${activeVideo.value.id}`;
});

function openPlayer(video) {
  activeVideo.value = video;
}

function closePlayer() {
  activeVideo.value = null;
}

// When user asked to "play" and we have videos, auto-open first video with autoplay
watch(
  () => [props.videos, props.autoPlayFirst],
  ([videos, autoPlayFirst]) => {
    if (autoPlayFirst && Array.isArray(videos) && videos.length > 0 && !activeVideo.value) {
      activeVideo.value = videos[0];
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.youtube-video-list {
  margin-top: 12px;
  width: 100%;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.video-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  background: var(--color-surface-2, rgba(15, 23, 42, 0.6));
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  padding: 0;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.video-thumb {
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.4);
  position: relative;
}

.video-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-thumb .no-thumb {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.video-info {
  padding: 8px 10px;
  min-height: 0;
}

.video-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.3;
}

.video-channel {
  display: block;
  margin-top: 4px;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-thumb {
  position: relative;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  padding-left: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.video-card:hover .play-icon {
  opacity: 1;
}

.video-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.video-modal {
  position: relative;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  background: var(--color-bg, #0f172a);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.8);
}

.video-modal-content {
  padding: 0;
}

.video-modal-content iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
}

.video-modal-meta {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--color-border);
}

.video-modal-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.open-youtube-link {
  font-size: 0.8rem;
  color: var(--color-accent, #6366f1);
  text-decoration: none;
  flex-shrink: 0;
}

.open-youtube-link:hover {
  text-decoration: underline;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
