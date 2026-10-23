<script setup lang="ts">
/**
 * RotationSection component
 * "In rotation now": the account's short-term top artists and tracks.
 * Hidden when the sync did not fetch them.
 */
import { useI18n } from "vue-i18n";

import { playlistRepository } from "@/repositories/PlaylistRepository.ts";

import CoverImage from "../ui/CoverImage.vue";

const { t } = useI18n();
const rotation = playlistRepository.rotation();
</script>

<template>
  <section
    v-if="rotation.artists.length + rotation.tracks.length > 0"
    class="rotation glass panel"
    aria-labelledby="rotation-title"
  >
    <h2 id="rotation-title" class="section-title">{{ t("stats.rotation") }}</h2>
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
        <a
          :href="track.url"
          target="_blank"
          rel="noopener"
          class="rotation__track"
        >
          <CoverImage :src="track.album.imageUrl" class="rotation__cover" />
          <span>
            <strong>{{ track.title }}</strong>
            <span class="muted">{{
              track.artists.map((artist) => artist.name).join(", ")
            }}</span>
          </span>
        </a>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.rotation__artists {
  list-style: none;
  margin: 0 0 18px;
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
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
}
.rotation__track {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  font-size: 14px;
}
.rotation__track > span {
  display: grid;
  min-width: 0;
}
.rotation__cover {
  flex: none;
  inline-size: 44px;
  --cover-radius: 8px;
}
</style>
