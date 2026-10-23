<script setup lang="ts">
/**
 * HomeView component
 * Every issue of the series in a grid that can be fuzzy-searched, sorted
 * and filtered.
 */
import type { Playlist } from "@music/shared";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import PlaylistCard from "@/components/playlists/PlaylistCard.vue";
import PlaylistToolbar from "@/components/playlists/PlaylistToolbar.vue";
import { useAccent } from "@/composables/useAccent.ts";
import { useCatalog } from "@/composables/useCatalog.ts";
import { releaseDistribution, tracksOf } from "@/services/stats";
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

const { t } = useI18n();
const { playlists, latest } = useCatalog();
const { sortId, direction, query, artistId, decade, tag } =
  storeToRefs(useBrowserStore());
useAccent(() => latest?.palette);

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
    <h1 class="sr-only">{{ t("home.title") }}</h1>
    <PlaylistToolbar :decades="decades" :result-count="visible.length" />
    <TransitionGroup
      v-if="visible.length > 0"
      tag="ul"
      name="grid"
      class="grid"
    >
      <li
        v-for="(playlist, index) in visible"
        :key="playlist.id"
        :style="{ '--i': Math.min(index, 12) }"
      >
        <PlaylistCard :playlist="playlist" />
      </li>
    </TransitionGroup>
    <p v-else class="glass panel muted empty">{{ t("home.empty") }}</p>
  </div>
</template>

<style scoped>
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
.grid li {
  animation: card-in 600ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--i) * 40ms);
}
@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
}
.grid-move {
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}
.grid-enter-active,
.grid-leave-active {
  transition:
    opacity 250ms ease,
    transform 250ms ease;
}
.grid-enter-from,
.grid-leave-to {
  opacity: 0;
  transform: scale(0.94);
}
.grid-leave-active {
  position: absolute;
  visibility: hidden;
}
.empty {
  margin: 0;
}
</style>
