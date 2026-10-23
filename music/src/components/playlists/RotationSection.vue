<script setup lang="ts">
/**
 * RotationSection component
 * "In rotazione ora": the account's short-term top artists and tracks.
 * Hidden when the sync did not fetch them.
 */
import { playlistRepository } from "@/repositories/PlaylistRepository.ts";

import CoverImage from "../ui/CoverImage.vue";

const rotation = playlistRepository.rotation();
</script>

<template>
  <section
    v-if="rotation.artists.length + rotation.tracks.length > 0"
    class="rotation glass panel"
    aria-labelledby="rotation-title"
  >
    <h2 id="rotation-title" class="section-title">In rotazione ora</h2>
    <ul v-if="rotation.artists.length > 0" class="rotation__artists">
      <li v-for="artist in rotation.artists" :key="artist.id">
        <a
          :href="artist.url"
          target="_blank"
          rel="noopener"
          class="rotation__artist"
        >
          <CoverImage :src="artist.imageUrl" class="rotation__avatar" />
          <span>{{ artist.name }}</span>
        </a>
      </li>
    </ul>
    <ol v-if="rotation.tracks.length > 0" class="rotation__tracks">
      <li v-for="track in rotation.tracks" :key="track.id">
        <a :href="track.url" target="_blank" rel="noopener">{{
          track.title
        }}</a>
        <span class="muted">
          · {{ track.artists.map((artist) => artist.name).join(", ") }}</span
        >
      </li>
    </ol>
  </section>
</template>

<style scoped>
.rotation__artists {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  display: flex;
  gap: 16px;
  overflow-x: auto;
}
.rotation__artist {
  display: grid;
  justify-items: center;
  gap: 6px;
  inline-size: 84px;
  font-size: 13px;
  text-align: center;
  text-decoration: none;
}
.rotation__avatar {
  --cover-radius: 50%;
  inline-size: 72px;
}
.rotation__tracks {
  margin: 0;
  padding-left: 1.4em;
  display: grid;
  gap: 4px;
  columns: 2 260px;
  font-size: 14px;
}
.rotation__tracks a {
  font-weight: 600;
  text-decoration: none;
}
</style>
