<script setup lang="ts">
/**
 * TrackTable component
 * The tracks of a playlist with their album covers, sortable by every
 * column and fuzzy-filterable. Playlist order is the default; a sorted
 * column cycles ascending → descending → playlist order.
 */
import type { Track } from "@music/shared";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import CoverImage from "@/components/ui/CoverImage.vue";
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

const { t } = useI18n();
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

const COLUMNS: readonly { id: TrackSortId; className?: string }[] = [
  { id: "title", className: "col-title" },
  { id: "album", className: "col-album" },
  { id: "year", className: "col-year" },
  { id: "added", className: "col-added" },
  { id: "duration", className: "col-duration" },
];
</script>

<template>
  <section class="tracks glass panel" aria-labelledby="tracks-title">
    <div class="tracks__head">
      <h2 id="tracks-title" class="section-title">{{ t("tracks.heading") }}</h2>
      <label class="tracks__filter">
        <span class="sr-only">{{ t("tracks.filterLabel") }}</span>
        <input
          id="track-filter"
          v-model="query"
          class="field"
          type="search"
          :placeholder="t('tracks.filterPlaceholder')"
        />
      </label>
    </div>
    <div class="tracks__scroll">
      <table>
        <caption class="sr-only">
          {{
            t("tracks.caption")
          }}
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
                {{ t(`tracks.${column.id}`) }}
                <span aria-hidden="true">{{
                  sortId === column.id ? (direction === "asc" ? "↑" : "↓") : ""
                }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <TransitionGroup tag="tbody" name="row">
          <tr v-for="track in rows" :key="`${track.id}-${track.addedAt}`">
            <td class="col-n muted tabular">{{ positions.get(track) }}</td>
            <td class="col-title">
              <div class="song">
                <a
                  v-tooltip="track.album.name"
                  :href="track.album.url"
                  target="_blank"
                  rel="noopener"
                  class="song__cover"
                  tabindex="-1"
                  aria-hidden="true"
                >
                  <CoverImage :src="track.album.imageUrl" />
                </a>
                <span class="song__text">
                  <a
                    :href="track.url"
                    target="_blank"
                    rel="noopener"
                    class="song__title"
                    >{{ track.title }}</a
                  >
                  <span class="song__artists muted">
                    <abbr
                      v-if="track.explicit"
                      v-tooltip="t('tracks.explicit')"
                      class="song__e"
                      :aria-label="t('tracks.explicit')"
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
                </span>
              </div>
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
            <td class="col-duration tabular">
              {{ formatTrackDuration(track.durationMs) }}
            </td>
          </tr>
        </TransitionGroup>
      </table>
      <p v-if="rows.length === 0" class="muted tracks__empty">
        {{ t("tracks.empty", { query }) }}
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
  vertical-align: middle;
  border-bottom: 1px solid var(--line);
}
td a {
  text-decoration: none;
}
td a:hover {
  text-decoration: underline;
}
tbody tr {
  transition: background 150ms ease;
}
tbody tr:hover {
  background: var(--glass);
}
.col-n {
  inline-size: 2.5em;
}
.col-added,
.col-year,
.col-duration {
  white-space: nowrap;
}
.song {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.song__cover {
  flex: none;
  inline-size: 46px;
  --cover-radius: 8px;
  transition: transform 200ms ease;
}
tbody tr:hover .song__cover {
  transform: scale(1.06);
}
.song__text {
  display: grid;
  min-width: 0;
}
.song__title {
  font-weight: 650;
}
.song__artists {
  font-size: 13px;
}
.song__e {
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
.tracks__empty {
  margin: 16px 8px;
}
.row-move {
  transition: transform 450ms cubic-bezier(0.22, 1, 0.36, 1);
}
.row-enter-active,
.row-leave-active {
  transition: opacity 200ms ease;
}
.row-enter-from,
.row-leave-to {
  opacity: 0;
}
@media (max-width: 899px) {
  .col-album,
  .col-added {
    display: none;
  }
}
@media (max-width: 560px) {
  .col-year {
    display: none;
  }
  .song__cover {
    inline-size: 40px;
  }
}
</style>
