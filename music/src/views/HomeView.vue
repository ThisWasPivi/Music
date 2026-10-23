<script setup lang="ts">
/**
 * HomeView component
 * Showcase of the series: the latest issue as hero, then every issue in a
 * grid that can be searched, sorted and filtered.
 */
import type { Playlist } from "@music/shared";
import { storeToRefs } from "pinia";
import { computed } from "vue";

import SpotifyLink from "@/components/player/SpotifyLink.vue";
import PlaylistCard from "@/components/playlists/PlaylistCard.vue";
import PlaylistToolbar from "@/components/playlists/PlaylistToolbar.vue";
import RotationSection from "@/components/playlists/RotationSection.vue";
import CoverImage from "@/components/ui/CoverImage.vue";
import IssueTitle from "@/components/ui/IssueTitle.vue";
import { useAccent } from "@/composables/useAccent.ts";
import { useCatalog } from "@/composables/useCatalog.ts";
import { releaseDistribution, summarize, tracksOf } from "@/services/stats";
import { useBrowserStore } from "@/stores/browser.ts";
import {
  type FilterStrategy,
  filterWith,
  sortWith,
} from "@/strategies/core.ts";
import {
  artistFilter,
  decadeFilter,
  playlistSortChain,
  tagFilter,
  textFilter,
} from "@/strategies/playlists.ts";
import {
  formatDate,
  formatLongDuration,
  formatNumber,
} from "@/utils/format.ts";

const { playlists, issues, latest } = useCatalog();
const { sortId, direction, query, artistId, decade, tag } =
  storeToRefs(useBrowserStore());
useAccent(() => latest?.palette);

const totals = summarize(tracksOf(playlists));
const decades = releaseDistribution(tracksOf(playlists), 10)
  .filter((bucket) => bucket.count > 0)
  .map((bucket) => bucket.key);

const visible = computed(() => {
  const filters: FilterStrategy<Playlist>[] = [textFilter(query.value)];
  if (artistId.value) filters.push(artistFilter(artistId.value));
  if (decade.value !== null) filters.push(decadeFilter(decade.value));
  if (tag.value) filters.push(tagFilter(tag.value));
  return sortWith(
    filterWith(playlists, filters),
    ...playlistSortChain(sortId.value, direction.value),
  );
});
</script>

<template>
  <div class="stack">
    <section v-if="latest" class="hero glass" aria-labelledby="hero-title">
      <RouterLink
        :to="{ name: 'playlist', params: { id: latest.id } }"
        class="hero__cover"
        tabindex="-1"
        aria-hidden="true"
      >
        <CoverImage :src="latest.coverUrl" :palette="latest.palette" eager />
      </RouterLink>
      <div class="hero__body">
        <p class="eyebrow">
          Ultima uscita · {{ formatDate(latest.firstAddedAt) }}
        </p>
        <h1 id="hero-title" class="page-title">
          <RouterLink
            :to="{ name: 'playlist', params: { id: latest.id } }"
            class="hero__link"
            ><IssueTitle :name="latest.name"
          /></RouterLink>
        </h1>
        <p v-if="latest.description" class="hero__text muted">
          {{ latest.description }}
        </p>
        <div class="chips">
          <span class="chip">{{ latest.trackCount }} brani</span>
          <span class="chip">{{ formatLongDuration(latest.durationMs) }}</span>
          <span v-for="value in latest.tags" :key="value" class="chip"
            >#{{ value }}</span
          >
        </div>
        <SpotifyLink :href="latest.url" />
      </div>
    </section>

    <p class="intro muted">
      <strong class="intro__name">Pivəəkly</strong> è una serie di playlist che
      esce quando c'è abbastanza musica da dire: {{ issues.length }} numeri,
      {{ formatNumber(totals.trackCount) }} brani,
      {{ formatLongDuration(totals.totalMs) }} di ascolto,
      {{ formatNumber(totals.uniqueArtistCount) }} artisti.
    </p>

    <RotationSection />

    <section aria-labelledby="all-title" class="stack">
      <h2 id="all-title" class="section-title all-title">Tutti i numeri</h2>
      <PlaylistToolbar :decades="decades" :result-count="visible.length" />
      <ul v-if="visible.length > 0" class="grid">
        <li v-for="playlist in visible" :key="playlist.id">
          <PlaylistCard :playlist="playlist" />
        </li>
      </ul>
      <p v-else class="glass panel muted empty">
        Nessuna playlist corrisponde ai filtri. Prova ad azzerarli.
      </p>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: grid;
  gap: 24px;
  padding: clamp(16px, 2.5vw, 24px);
}
@media (min-width: 760px) {
  .hero {
    grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
    align-items: center;
  }
}
.hero__cover {
  display: block;
  inline-size: 100%;
  max-inline-size: 260px;
  --cover-radius: 18px;
  filter: drop-shadow(
    0 28px 50px color-mix(in oklab, var(--c1) 55%, transparent)
  );
}
.hero__body {
  display: grid;
  gap: 14px;
  justify-items: start;
  min-width: 0;
}
.hero__link {
  text-decoration: none;
}
.hero__text {
  margin: 0;
  max-inline-size: 60ch;
}
.intro {
  margin: 0;
  max-inline-size: 70ch;
  font-size: 16px;
}
.intro__name {
  color: var(--text);
}
.all-title {
  margin: 8px 0 0;
}
.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}
@media (min-width: 700px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  }
}
.empty {
  margin: 0;
}
</style>
