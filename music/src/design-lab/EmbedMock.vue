<script setup lang="ts">
/**
 * EmbedMock component
 * Stand-in for the official Spotify embed iframe, which cannot load the
 * invented fixture ids. The real app renders the iframe in the same slot.
 */
import type { Playlist } from "@music/shared";

import SpotifyMark from "@/components/player/SpotifyMark.vue";
import { formatTrackDuration } from "@/utils/format.ts";

defineProps<{
  /** Playlist the embed would play. */
  playlist: Playlist;
}>();
</script>

<template>
  <div
    class="embed"
    role="img"
    :aria-label="`Anteprima del player Spotify per ${playlist.name}`"
  >
    <div class="embed__head">
      <img :src="playlist.coverUrl ?? ''" alt="" class="embed__cover" />
      <div class="embed__meta">
        <strong>{{ playlist.name }}</strong>
        <span>Pivi</span>
      </div>
      <SpotifyMark class="embed__logo" />
    </div>
    <ol class="embed__list">
      <li v-for="track in playlist.tracks.slice(0, 4)" :key="track.id">
        <span class="embed__title">{{ track.title }}</span>
        <span class="embed__artist">{{
          track.artists.map((artist) => artist.name).join(", ")
        }}</span>
        <span class="embed__time">{{
          formatTrackDuration(track.durationMs)
        }}</span>
      </li>
    </ol>
    <span class="embed__note">Embed Spotify (iframe ufficiale nell'app)</span>
  </div>
</template>

<style scoped>
.embed {
  position: relative;
  background: linear-gradient(
    160deg,
    color-mix(in oklab, v-bind("playlist.palette[0]") 70%, #000),
    #121212 80%
  );
  color: #fff;
  border-radius: var(--embed-radius, 12px);
  padding: 14px;
  font:
    13px/1.35 ui-sans-serif,
    system-ui,
    sans-serif;
}
.embed__head {
  display: flex;
  gap: 12px;
  align-items: center;
}
.embed__cover {
  inline-size: 64px;
  block-size: 64px;
  border-radius: 6px;
  object-fit: cover;
}
.embed__meta {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.embed__meta span {
  color: rgb(255 255 255 / 0.7);
}
.embed__logo {
  font-size: 22px;
}
.embed__list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  gap: 6px;
}
.embed__list li {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 8px;
}
.embed__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.embed__artist {
  grid-column: 1;
  color: rgb(255 255 255 / 0.65);
  font-size: 12px;
}
.embed__time {
  grid-row: 1 / span 2;
  grid-column: 2;
  align-self: center;
  color: rgb(255 255 255 / 0.65);
}
.embed__note {
  display: block;
  margin-top: 10px;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.5);
}
</style>
