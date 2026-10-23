<script setup lang="ts">
/**
 * PlaylistToolbar component
 * Search, sort and filters of the showcase, bound to the browser store.
 */
import { storeToRefs } from "pinia";

import { useCatalog } from "@/composables/useCatalog.ts";
import { useBrowserStore } from "@/stores/browser.ts";
import { PLAYLIST_SORTS } from "@/strategies/playlists.ts";

defineProps<{
  /** Decades present in the catalogue. */
  decades: readonly number[];

  /** Number of playlists after filtering. */
  resultCount: number;
}>();

const store = useBrowserStore();
const { sortId, direction, query, artistId, decade, tag, activeFilterCount } =
  storeToRefs(store);
const { artists, tags } = useCatalog();
</script>

<template>
  <section class="toolbar" aria-label="Cerca, ordina e filtra">
    <label class="toolbar__search">
      <span class="sr-only">Cerca playlist, brani o artisti</span>
      <input
        id="playlist-search"
        v-model="query"
        class="field"
        type="search"
        placeholder="Cerca playlist, brani, artisti…"
        autocomplete="off"
      />
    </label>

    <div class="toolbar__row">
      <span id="sort-label" class="toolbar__label muted">Ordina</span>
      <div class="chips" role="group" aria-labelledby="sort-label">
        <button
          v-for="{ strategy } in PLAYLIST_SORTS"
          :key="strategy.id"
          type="button"
          class="chip"
          :aria-pressed="sortId === strategy.id"
          @click="store.setSort(strategy.id)"
        >
          {{ strategy.label }}
          <span v-if="sortId === strategy.id" aria-hidden="true">{{
            direction === "desc" ? "↓" : "↑"
          }}</span>
          <span v-if="sortId === strategy.id" class="sr-only">
            {{ direction === "desc" ? "decrescente" : "crescente" }}
          </span>
        </button>
      </div>
    </div>

    <div class="toolbar__row">
      <span class="toolbar__label muted">Filtra</span>
      <div class="chips">
        <label>
          <span class="sr-only">Artista</span>
          <select id="filter-artist" v-model="artistId" class="chip">
            <option :value="null">Tutti gli artisti</option>
            <option
              v-for="artist in artists"
              :key="artist.id"
              :value="artist.id"
            >
              {{ artist.name }}
            </option>
          </select>
        </label>
        <label>
          <span class="sr-only">Decennio di uscita</span>
          <select id="filter-decade" v-model="decade" class="chip">
            <option :value="null">Ogni decennio</option>
            <option v-for="value in decades" :key="value" :value="value">
              Anni {{ value }}
            </option>
          </select>
        </label>
        <button
          v-for="value in tags"
          :key="value"
          type="button"
          class="chip"
          :aria-pressed="tag === value"
          @click="tag = tag === value ? null : value"
        >
          #{{ value }}
        </button>
        <button
          v-if="activeFilterCount > 0"
          type="button"
          class="chip toolbar__reset"
          @click="store.resetFilters()"
        >
          Azzera filtri
        </button>
      </div>
    </div>
    <p class="muted toolbar__count" aria-live="polite">
      {{ resultCount }} {{ resultCount === 1 ? "playlist" : "playlist" }}
    </p>
  </section>
</template>

<style scoped>
.toolbar {
  display: grid;
  gap: 12px;
}
.toolbar__row {
  display: grid;
  grid-template-columns: 4.5em minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}
.toolbar__label {
  padding-top: 7px;
  font-size: 13px;
}
.toolbar__reset {
  border-style: dashed;
}
.toolbar__count {
  margin: 0;
  font-size: 13px;
}
@media (max-width: 600px) {
  .toolbar__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
  .toolbar__label {
    padding-top: 0;
  }
}
</style>
