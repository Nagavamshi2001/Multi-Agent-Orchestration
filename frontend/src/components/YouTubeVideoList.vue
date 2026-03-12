<template>
  <div class="youtube-video-list" v-if="videos.length > 0">
    <div class="video-scroll-container">
      <div
        v-for="video in videos"
        :key="video.id"
        class="video-card"
        :class="{ 'is-playing': playingId === video.id }"
      >
        <!-- Thumbnail View -->
        <template v-if="playingId !== video.id">
          <button class="video-thumb-btn" type="button" @click="playInline(video)">
            <img v-if="video.thumbnailUrl" :src="video.thumbnailUrl" :alt="video.title" loading="lazy" />
            <div v-else class="no-thumb">No thumbnail</div>
            
            <div class="play-overlay">
              <div class="play-button-glass">
                <svg viewBox="0 0 24 24" fill="currentColor" class="play-svg">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
          
          <div class="video-info">
            <span class="video-title" :title="video.title">{{ video.title || 'Untitled' }}</span>
            <span v-if="video.channelTitle" class="video-channel">{{ video.channelTitle }}</span>
          </div>
        </template>
        
        <!-- Inline Player View -->
        <template v-else>
          <div class="video-player-wrapper">
            <iframe
              :src="`https://www.youtube.com/embed/${video.id}?autoplay=1`"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
            <div class="player-actions">
              <button @click="stopInline" class="btn-close-player">Close player</button>
              <a :href="`https://www.youtube.com/watch?v=${video.id}`" target="_blank" class="btn-open-youtube">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                Watch on YouTube
              </a>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

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

const playingId = ref(null);

function playInline(video) {
  playingId.value = video.id;
}

function stopInline() {
  playingId.value = null;
}

// When user asked to "play" and we have videos, auto-open first video
watch(
  () => [props.videos, props.autoPlayFirst],
  ([videos, autoPlayFirst]) => {
    if (autoPlayFirst && Array.isArray(videos) && videos.length > 0 && !playingId.value) {
      playingId.value = videos[0].id;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.youtube-video-list {
  margin-top: 16px;
  margin-bottom: 8px;
  width: 100%;
}

.video-scroll-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px; /* Space for scrollbar and shadow */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  /* Smooth scrolling on touch devices */
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
}

.video-scroll-container::-webkit-scrollbar {
  height: 6px;
}
.video-scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 99px;
}

.video-card {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
  scroll-snap-align: start;
}

.video-card.is-playing {
  flex: 0 0 420px; /* Expand width when playing */
  max-width: 100%;
  border-color: rgba(239, 68, 68, 0.4); /* Subtle red border when active */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.2);
}

.video-card:not(.is-playing):hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}

.video-thumb-btn {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  padding: 0;
  border: none;
  background: #000;
  cursor: pointer;
  display: block;
  overflow: hidden;
}

.video-thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.4s ease, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.video-thumb-btn:hover img {
  opacity: 0.6;
  transform: scale(1.05);
}

.no-thumb {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  transition: background 0.3s ease;
}

.video-thumb-btn:hover .play-overlay {
  background: rgba(0, 0, 0, 0.3);
}

.play-button-glass {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, border-color 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.video-thumb-btn:hover .play-button-glass {
  transform: scale(1.15);
  background: #ef4444; /* YouTube red */
  border-color: #f87171;
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.play-svg {
  width: 24px;
  height: 24px;
  margin-left: 4px; /* visually center the triangle */
}

.video-info {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--color-surface);
}

.video-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-channel {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Inline Player state */
.video-player-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.video-player-wrapper iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-bottom: 1px solid var(--color-border);
}

.player-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--color-surface);
}

.btn-close-player {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close-player:hover {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-open-youtube {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
}

.btn-open-youtube:hover {
  color: #ef4444; /* YouTube red */
}

@media (max-width: 600px) {
  .video-card {
    flex: 0 0 240px;
  }
  .video-card.is-playing {
    flex: 0 0 100%;
  }
}
</style>
