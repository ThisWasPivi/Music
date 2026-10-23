<script setup lang="ts">
/**
 * PlaylistView component
 * One issue: header with cover and facts, the Spotify player, the sortable
 * tracklist and links to the neighbouring issues.
 */
import { computed } from "vue";

import SpotifyEmbed from "@/components/player/SpotifyEmbed.vue";
import SpotifyLink from "@/components/player/SpotifyLink.vue";
import SeriesPager from "@/components/playlists/SeriesPager.vue";
import TrackTable from "@/components/playlists/TrackTable.vue";
import CoverImage from "@/components/ui/CoverImage.vue";
import IssueTitle from "@/components/ui/IssueTitle.vue";
import { useAccent } from "@/composables/useAccent.ts";
import { useCatalog } from "@/composables/useCatalog.ts";
import { summarize } from "@/services/stats";
import {
  formatDate,
  formatIssue,
  formatLongDuration,
  formatPercent,
  formatTrackDuration,
} from "@/utils/format.ts";

import NotFoundView from "./NotFoundView.vue";

const props = defineProps<{
  /** Spotify id of the playlist, from the route. */
  id: string;
}>();

const catalog = useCatalog();
const playlist = computed(() => catalog.byId(props.id));
const neighbours = computed(() =>
  playlist.value ? catalog.neighbours(playlist.value) : {},
);
const summary = computed(() => summarize(playlist.value?.tracks ?? []));
useAccent(() => playlist.value?.palette);
</script>

<template>
  <NotFoundView v-if="!playlist" />
  <div v-else class="stack page">
    <div v-if="playlist.coverUrl" class="backdrop" aria-hidden="true">
      <img :src="playlist.coverUrl" alt="" />
    </div>
    <section class="head" aria-labelledby="playlist-title">
      <a
        :href="playlist.url"
        target="_blank"
        rel="noopener"
        class="head__cover"
        :aria-label="`Apri ${playlist.name} su Spotify`"
      >
        <CoverImage
          :src="playlist.coverUrl"
          :palette="playlist.palette"
          eager
        />
      </a>
      <div class="head__body">
        <p class="eyebrow">Pivəəkly · {{ formatIssue(playlist.number) }}</p>
        <h1 id="playlist-title" class="page-title head__title">
          <IssueTitle :name="playlist.name" />
        </h1>
        <p v-if="playlist.description" class="head__text muted">
          {{ playlist.description }}
        </p>
        <dl class="facts">
          <div>
            <dt>Uscita<sup>*</sup></dt>
            <dd>{{ formatDate(playlist.firstAddedAt) }}</dd>
          </div>
          <div>
            <dt>Aggiornata</dt>
            <dd>{{ formatDate(playlist.lastAddedAt) }}</dd>
          </div>
          <div>
            <dt>Brani</dt>
            <dd>{{ playlist.trackCount }}</dd>
          </div>
          <div>
            <dt>Durata</dt>
            <dd>{{ formatLongDuration(playlist.durationMs) }}</dd>
          </div>
          <div>
            <dt>Media</dt>
            <dd>{{ formatTrackDuration(summary.averageMs) }}</dd>
          </div>
          <div>
            <dt>Espliciti</dt>
            <dd>{{ formatPercent(summary.explicitShare) }}</dd>
          </div>
        </dl>
        <div class="chips">
          <span v-for="tag in playlist.tags" :key="tag" class="chip"
            >#{{ tag }}</span
          >
        </div>
        <SpotifyLink :href="playlist.url" label="Apri su Spotify" />
      </div>
    </section>

    <div class="body">
      <TrackTable :tracks="playlist.tracks" />
      <aside class="aside" aria-label="Ascolta">
        <SpotifyEmbed :playlist="playlist" />
        <SeriesPager :previous="neighbours.previous" :next="neighbours.next" />
        <p class="muted note">
          <sup>*</sup> Data di uscita approssimata: è il giorno del primo brano
          aggiunto, perché Spotify non dice quando una playlist è stata
          pubblicata.
        </p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page {
  position: relative;
}
/* The cover itself, blurred, glows behind the header as in the Aurora mock-up. */
.backdrop {
  position: absolute;
  inset: -320px calc(-1 * var(--gutter)) auto;
  block-size: 900px;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  mask-image: linear-gradient(transparent, #000 30%, #000 55%, transparent);
}
.backdrop img {
  inline-size: 100%;
  max-inline-size: none;
  block-size: 100%;
  object-fit: cover;
  filter: blur(70px) saturate(1.5);
  opacity: 0.7;
  transform: scale(1.2);
}
.head {
  display: grid;
  gap: 24px;
  align-items: end;
}
@media (min-width: 760px) {
  .head {
    grid-template-columns: minmax(200px, 280px) minmax(0, 1fr);
  }
}
.head__cover {
  display: block;
  max-inline-size: 280px;
  --cover-radius: 18px;
  filter: drop-shadow(
    0 30px 60px color-mix(in oklab, var(--c1) 50%, transparent)
  );
}
.head__body {
  display: grid;
  gap: 14px;
  justify-items: start;
  min-width: 0;
}
.head__title {
  font-size: clamp(40px, 7vw, 84px);
}
.head__text {
  margin: 0;
  max-inline-size: 65ch;
}
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin: 0;
}
.facts dt {
  font-size: 12px;
  color: var(--muted);
}
.facts dd {
  margin: 0;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.body {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 1040px) {
  .body {
    grid-template-columns: minmax(0, 1fr) 340px;
    align-items: start;
  }
  .aside {
    position: sticky;
    top: 90px;
  }
}
.aside {
  display: grid;
  gap: 14px;
}
.note {
  margin: 0;
  font-size: 12px;
}
</style>
