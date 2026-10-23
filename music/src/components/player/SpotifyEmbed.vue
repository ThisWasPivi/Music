<script setup lang="ts">
/**
 * SpotifyEmbed component
 * The official Spotify embed player: no login needed to listen to previews,
 * full tracks for logged-in listeners. With the sample data the ids are
 * invented, so a labelled placeholder takes its place.
 */
import type { Playlist } from "@music/shared";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { playlistRepository } from "@/repositories/PlaylistRepository.ts";

import SpotifyMark from "./SpotifyMark.vue";

defineProps<{
  /** Playlist to play. */
  playlist: Playlist;
}>();

const { t } = useI18n();
const ready = ref(false);
const isSample = playlistRepository.meta().source === "fixtures";
</script>

<template>
  <div class="embed" :class="{ 'embed--ready': ready || isSample }">
    <div v-if="!isSample && !ready" class="embed__skeleton" aria-hidden="true">
      <span class="embed__sk-cover" />
      <span class="embed__sk-line embed__sk-line--wide" />
      <span class="embed__sk-line" />
      <span v-for="row in 4" :key="row" class="embed__sk-row" />
    </div>
    <iframe
      v-if="!isSample"
      :src="`https://open.spotify.com/embed/playlist/${encodeURIComponent(playlist.id)}?utm_source=generator`"
      :title="t('playlist.playerTitle', { name: playlist.name })"
      width="100%"
      height="352"
      loading="lazy"
      allow="
        autoplay;
        clipboard-write;
        encrypted-media;
        fullscreen;
        picture-in-picture;
      "
      @load="ready = true"
    />
    <div v-else class="embed__placeholder">
      <SpotifyMark class="embed__logo" />
      <p>{{ t("playlist.samplePlayer", { name: playlist.name }) }}</p>
    </div>
  </div>
</template>

<style scoped>
.embed {
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-block-size: 152px;
}
.embed {
  position: relative;
}
.embed iframe {
  display: block;
  border: 0;
  opacity: 0;
  transition: opacity 500ms ease;
}
.embed--ready iframe {
  opacity: 1;
}
/* Skeleton of the Spotify player, shimmering until the iframe has loaded. */
.embed__skeleton {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 96px 1fr;
  grid-auto-rows: min-content;
  gap: 12px 14px;
  padding: 16px;
  background: linear-gradient(
    160deg,
    color-mix(in oklab, var(--c1) 55%, #000),
    #121212 85%
  );
}
.embed__skeleton > span {
  display: block;
  border-radius: 8px;
  background: linear-gradient(
    105deg,
    rgb(255 255 255 / 0.08) 30%,
    rgb(255 255 255 / 0.22) 50%,
    rgb(255 255 255 / 0.08) 70%
  );
  background-size: 250% 100%;
  animation: embed-sheen 1.3s ease-in-out infinite;
}
.embed__sk-cover {
  grid-row: span 2;
  aspect-ratio: 1;
}
.embed__sk-line {
  block-size: 14px;
  inline-size: 50%;
  align-self: center;
}
.embed__sk-line--wide {
  inline-size: 80%;
  block-size: 20px;
}
.embed__sk-row {
  grid-column: 1 / -1;
  block-size: 38px;
}
@keyframes embed-sheen {
  from {
    background-position: 130% 0;
  }
  to {
    background-position: -130% 0;
  }
}
.embed__placeholder {
  display: grid;
  place-items: center;
  gap: 10px;
  min-block-size: 200px;
  padding: 24px;
  text-align: center;
  color: #fff;
  background: linear-gradient(
    160deg,
    color-mix(in oklab, var(--c1) 65%, #000),
    #121212 85%
  );
}
.embed__placeholder p {
  margin: 0;
  max-inline-size: 34ch;
  font-size: 14px;
}
.embed__logo {
  font-size: 32px;
  color: var(--spotify);
}
</style>
