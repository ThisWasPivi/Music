<script setup lang="ts">
/**
 * ArtistView component
 * One artist across the series: in which issues they appear and with which
 * tracks.
 */
import { computed } from "vue";

import SpotifyLink from "@/components/player/SpotifyLink.vue";
import CoverImage from "@/components/ui/CoverImage.vue";
import StatTile from "@/components/ui/StatTile.vue";
import { useAccent } from "@/composables/useAccent.ts";
import { useCatalog } from "@/composables/useCatalog.ts";
import { recurringArtists } from "@/services/stats";
import {
  formatIssue,
  formatLongDuration,
  formatTrackDuration,
} from "@/utils/format.ts";

import NotFoundView from "./NotFoundView.vue";

const props = defineProps<{
  /** Spotify artist id, from the route. */
  id: string;
}>();

const catalog = useCatalog();
const artist = computed(() =>
  catalog.artists.find((entry) => entry.id === props.id),
);
const profile = computed(() => catalog.profile(props.id));
const appearances = computed(() =>
  catalog.playlists
    .map((playlist) => ({
      playlist,
      tracks: playlist.tracks.filter((track) =>
        track.artists.some((credit) => credit.id === props.id),
      ),
    }))
    .filter((entry) => entry.tracks.length > 0),
);
const stats = computed(() =>
  recurringArtists(catalog.playlists).find((row) => row.artist.id === props.id),
);
const totalMs = computed(() =>
  appearances.value.reduce(
    (sum, entry) =>
      sum + entry.tracks.reduce((acc, track) => acc + track.durationMs, 0),
    0,
  ),
);
useAccent(() => appearances.value[0]?.playlist.palette);
</script>

<template>
  <NotFoundView v-if="!artist" />
  <div v-else class="stack">
    <section class="head" aria-labelledby="artist-title">
      <CoverImage :src="profile?.imageUrl ?? null" class="head__image" eager />
      <div class="head__body">
        <p class="eyebrow">Artista</p>
        <h1 id="artist-title" class="page-title">{{ artist.name }}</h1>
        <SpotifyLink :href="artist.url" label="Apri su Spotify" />
      </div>
    </section>

    <div class="tiles">
      <StatTile label="Numeri" :value="String(appearances.length)" />
      <StatTile
        label="Brani"
        :value="
          String(
            appearances.reduce((sum, entry) => sum + entry.tracks.length, 0),
          )
        "
      />
      <StatTile label="Ascolto" :value="formatLongDuration(totalMs)" />
      <StatTile
        v-if="stats"
        label="Dal – al"
        :value="`${stats.firstIssue} – ${stats.lastIssue}`"
        :detail="`${stats.longestStreak} numeri di fila al massimo`"
      />
    </div>

    <section class="glass panel" aria-labelledby="appearances-title">
      <h2 id="appearances-title" class="section-title">Dove compare</h2>
      <ul class="list">
        <li
          v-for="entry in appearances"
          :key="entry.playlist.id"
          class="list__item"
        >
          <RouterLink
            :to="{ name: 'playlist', params: { id: entry.playlist.id } }"
            class="list__playlist"
          >
            <CoverImage
              :src="entry.playlist.coverUrl"
              :palette="entry.playlist.palette"
              class="list__cover"
            />
            <span>
              <strong>{{ entry.playlist.name }}</strong>
              <span class="muted">
                · {{ formatIssue(entry.playlist.number) }}</span
              >
            </span>
          </RouterLink>
          <ol class="list__tracks">
            <li v-for="track in entry.tracks" :key="track.id">
              <a :href="track.url" target="_blank" rel="noopener">{{
                track.title
              }}</a>
              <span class="muted tabular">
                · {{ track.album.name }} ·
                {{ formatTrackDuration(track.durationMs) }}</span
              >
            </li>
          </ol>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 24px;
}
.head__image {
  --cover-radius: 50%;
  inline-size: clamp(120px, 22vw, 200px);
  box-shadow: 0 24px 60px -24px var(--c1);
}
.head__body {
  display: grid;
  gap: 14px;
  justify-items: start;
  min-width: 0;
}
.tiles {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 170px), 1fr));
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 18px;
}
.list__playlist {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}
.list__cover {
  --cover-radius: 8px;
  inline-size: 48px;
  flex: none;
}
.list__tracks {
  margin: 8px 0 0 60px;
  padding-left: 1.1em;
  display: grid;
  gap: 4px;
  font-size: 14px;
}
.list__tracks a {
  font-weight: 600;
  text-decoration: none;
}
@media (max-width: 500px) {
  .list__tracks {
    margin-left: 0;
  }
}
</style>
