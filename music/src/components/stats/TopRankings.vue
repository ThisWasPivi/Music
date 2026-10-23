<script setup lang="ts">
/**
 * TopRankings component
 * Top artists or albums of a set of tracks, by track count or minutes.
 */
import type { Track } from "@music/shared";
import { computed, ref } from "vue";

import { type RankingMetric, topAlbums, topArtists } from "@/services/stats";
import { formatLongDuration, formatNumber } from "@/utils/format.ts";

import BarRanking, { type BarRow } from "./BarRanking.vue";

const props = withDefaults(
  defineProps<{
    /** Tracks to rank. */
    tracks: readonly Track[];

    /** Rank artists or albums. */
    kind: "artists" | "albums";

    /** Rows to show. */
    limit?: number;
  }>(),
  { limit: 10 },
);

const metric = ref<RankingMetric>("tracks");
const id = `ranking-${props.kind}`;

const rows = computed<BarRow[]>(() => {
  const ranking =
    props.kind === "artists"
      ? topArtists(props.tracks, metric.value, props.limit)
      : topAlbums(props.tracks, metric.value, props.limit);
  return ranking.map((row) => ({
    key: row.item.id,
    label: row.item.name,
    sublabel:
      metric.value === "tracks"
        ? formatLongDuration(row.totalMs)
        : `${row.trackCount} brani`,
    value: metric.value === "tracks" ? row.trackCount : row.totalMs,
    display:
      metric.value === "tracks"
        ? formatNumber(row.trackCount)
        : formatLongDuration(row.totalMs),
  }));
});

const artistLinks = computed(() => props.kind === "artists");
</script>

<template>
  <section class="glass panel" :aria-labelledby="id">
    <div class="head">
      <h2 :id="id" class="section-title">
        {{ kind === "artists" ? "Top artisti" : "Top album" }}
      </h2>
      <div
        class="chips"
        role="group"
        :aria-label="`Ordina ${kind === 'artists' ? 'artisti' : 'album'} per`"
      >
        <button
          type="button"
          class="chip"
          :aria-pressed="metric === 'tracks'"
          @click="metric = 'tracks'"
        >
          brani
        </button>
        <button
          type="button"
          class="chip"
          :aria-pressed="metric === 'minutes'"
          @click="metric = 'minutes'"
        >
          minuti
        </button>
      </div>
    </div>
    <BarRanking :rows="rows" :link="artistLinks ? 'artist' : undefined" />
    <p v-if="rows.length === 0" class="muted">Nessun dato.</p>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.head .section-title {
  margin: 0;
}
</style>
