<script setup lang="ts">
/**
 * SpotifyEmbed component
 * The official Spotify embed player: no login needed to listen to previews,
 * full tracks for logged-in listeners. With the sample data the ids are
 * invented, so a labelled placeholder takes its place.
 */
import type { Playlist } from "@music/shared";

import { playlistRepository } from "@/repositories/PlaylistRepository.ts";

import SpotifyMark from "./SpotifyMark.vue";

defineProps<{
  /** Playlist to play. */
  playlist: Playlist;
}>();

const isSample = playlistRepository.meta().source === "fixtures";
</script>

<template>
  <div class="embed">
    <iframe
      v-if="!isSample"
      :src="`https://open.spotify.com/embed/playlist/${encodeURIComponent(playlist.id)}?utm_source=generator`"
      :title="`Player Spotify: ${playlist.name}`"
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
    />
    <div v-else class="embed__placeholder">
      <SpotifyMark class="embed__logo" />
      <p>
        Qui c'è il player Spotify di <strong>{{ playlist.name }}</strong
        >. Con i dati di esempio non può suonare.
      </p>
    </div>
  </div>
</template>

<style scoped>
.embed {
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-block-size: 152px;
}
.embed iframe {
  display: block;
  border: 0;
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
