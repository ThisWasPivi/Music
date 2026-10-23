<script setup lang="ts">
/**
 * TrackTable component
 * The tracks of a playlist, sortable by every column and filterable by
 * text. Playlist order is the default; a sorted column cycles asc → desc →
 * playlist order.
 */
import type { Track } from "@music/shared";
import { computed, ref } from "vue";

import {
  filterWith,
  type SortDirection,
  sortWith,
  withDirection,
} from "@/strategies/core.ts";
import {
  TRACK_SORTS,
  type TrackSortId,
  trackTextFilter,
} from "@/strategies/tracks.ts";
import { formatDate, formatTrackDuration } from "@/utils/format.ts";

const props = defineProps<{
  /** Tracks in playlist order. */
  tracks: readonly Track[];
}>();

const query = ref("");
const sortId = ref<TrackSortId | null>(null);
const direction = ref<SortDirection>("asc");

const positions = computed(
  () => new Map(props.tracks.map((track, index) => [track, index + 1])),
);

const rows = computed(() => {
  const filtered = filterWith(props.tracks, [trackTextFilter(query.value)]);
  const strategy = TRACK_SORTS.find((sort) => sort.id === sortId.value);
  return strategy
    ? sortWith(filtered, withDirection(strategy, direction.value))
    : filtered;
});

/**
 * Cycles a column's sort: ascending, descending, then playlist order.
 * @param id - Column to sort by
 * @returns Nothing
 */
function toggleSort(id: TrackSortId): void {
  if (sortId.value !== id) {
    sortId.value = id;
    direction.value = "asc";
  } else if (direction.value === "asc") {
    direction.value = "desc";
  } else {
    sortId.value = null;
  }
}

/**
 * Computes the ARIA sort state of a column.
 * @param id - The column
 * @returns The aria-sort value
 */
function ariaSort(id: TrackSortId): "ascending" | "descending" | "none" {
  if (sortId.value !== id) return "none";
  return direction.value === "asc" ? "ascending" : "descending";
}

const COLUMNS: readonly {
  id: TrackSortId;
  label: string;
  className?: string;
}[] = [
  { id: "title", label: "Titolo" },
  { id: "artist", label: "Artista", className: "col-artist" },
  { id: "album", label: "Album", className: "col-album" },
  { id: "year", label: "Anno", className: "col-year" },
  { id: "added", label: "Aggiunto", className: "col-added" },
  { id: "duration", label: "Durata" },
];
</script>

<template>
  <section class="tracks glass panel" aria-labelledby="tracks-title">
    <div class="tracks__head">
      <h2 id="tracks-title" class="section-title">Brani</h2>
      <label class="tracks__filter">
        <span class="sr-only">Filtra i brani per titolo, artista o album</span>
        <input
          id="track-filter"
          v-model="query"
          class="field"
          type="search"
          placeholder="Filtra i brani…"
        />
      </label>
    </div>
    <div class="tracks__scroll">
      <table>
        <caption class="sr-only">
          Brani della playlist, ordinabili per colonna
        </caption>
        <thead>
          <tr>
            <th scope="col" class="col-n">
              <button
                type="button"
                :class="{ on: sortId === null }"
                @click="sortId = null"
              >
                #
              </button>
            </th>
            <th
              v-for="column in COLUMNS"
              :key="column.id"
              scope="col"
              :class="column.className"
              :aria-sort="ariaSort(column.id)"
            >
              <button
                type="button"
                :class="{ on: sortId === column.id }"
                @click="toggleSort(column.id)"
              >
                {{ column.label }}
                <span aria-hidden="true">{{
                  sortId === column.id ? (direction === "asc" ? "↑" : "↓") : ""
                }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="track in rows" :key="`${track.id}-${track.addedAt}`">
            <td class="col-n muted tabular">{{ positions.get(track) }}</td>
            <td class="col-title">
              <a
                :href="track.url"
                target="_blank"
                rel="noopener"
                class="tracks__title"
                >{{ track.title }}</a
              >
              <span class="tracks__sub muted">
                <abbr
                  v-if="track.explicit"
                  class="tracks__e"
                  title="Contenuto esplicito"
                  >E</abbr
                >
                <template
                  v-for="(artist, index) in track.artists"
                  :key="artist.id"
                >
                  <RouterLink
                    :to="{ name: 'artist', params: { id: artist.id } }"
                    >{{ artist.name }}</RouterLink
                  ><template v-if="index < track.artists.length - 1"
                    >,
                  </template>
                </template>
              </span>
            </td>
            <td class="col-artist">
              <template
                v-for="(artist, index) in track.artists"
                :key="artist.id"
              >
                <RouterLink
                  :to="{ name: 'artist', params: { id: artist.id } }"
                  >{{ artist.name }}</RouterLink
                ><template v-if="index < track.artists.length - 1">, </template>
              </template>
            </td>
            <td class="col-album muted">
              <a :href="track.album.url" target="_blank" rel="noopener">{{
                track.album.name
              }}</a>
            </td>
            <td class="col-year muted tabular">
              {{ track.releaseYear ?? "—" }}
            </td>
            <td class="col-added muted tabular">
              {{ formatDate(track.addedAt) }}
            </td>
            <td class="tabular">{{ formatTrackDuration(track.durationMs) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="rows.length === 0" class="muted tracks__empty">
        Nessun brano corrisponde a “{{ query }}”.
      </p>
    </div>
  </section>
</template>

<style scoped>
.tracks__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.tracks__head .section-title {
  margin: 0;
}
.tracks__filter {
  flex: 1 1 220px;
  max-inline-size: 340px;
}
.tracks__scroll {
  overflow-x: auto;
}
table {
  inline-size: 100%;
  border-collapse: collapse;
}
th {
  text-align: left;
  padding: 0;
  border-bottom: 1px solid var(--line);
}
th button {
  padding: 8px;
  border: 0;
  background: none;
  color: var(--muted);
  font: 500 12px var(--font-body);
  cursor: pointer;
  white-space: nowrap;
}
th button.on {
  color: var(--text);
}
td {
  padding: 8px;
  vertical-align: top;
  border-bottom: 1px solid var(--line);
}
td a {
  text-decoration: none;
}
td a:hover {
  text-decoration: underline;
}
tbody tr:hover {
  background: var(--glass);
}
.col-n {
  inline-size: 2.5em;
}
.col-added,
.col-year,
td:last-child {
  white-space: nowrap;
}
.tracks__title {
  display: block;
  font-weight: 600;
}
.tracks__sub {
  display: none;
  font-size: 13px;
}
.tracks__e {
  display: inline-block;
  margin-right: 4px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--muted);
  color: var(--bg);
  font-size: 10px;
  line-height: 1.5;
  text-decoration: none;
}
.col-artist .tracks__e {
  display: none;
}
.tracks__empty {
  margin: 16px 8px;
}
@media (max-width: 899px) {
  .col-album,
  .col-added {
    display: none;
  }
}
@media (max-width: 640px) {
  .col-artist,
  .col-year {
    display: none;
  }
  .tracks__sub {
    display: block;
  }
}
</style>
