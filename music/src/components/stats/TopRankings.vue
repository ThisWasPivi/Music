<script setup lang="ts">
/**
 * TopRankings component
 * Top artists or albums of a set of tracks, by track count or minutes,
 * with artist pictures and album covers.
 */
import type { Track } from "@music/shared";
import { computed, ref, useId } from "vue";
import { useI18n } from "vue-i18n";

import { useCatalog } from "@/composables/useCatalog.ts";
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

const { t } = useI18n();
const { profile } = useCatalog();
const metric = ref<RankingMetric>("tracks");
const id = useId();

const rows = computed<BarRow[]>(() => {
  const ranking =
    props.kind === "artists"
      ? topArtists(props.tracks, metric.value, props.limit).map((row) => ({
          ...row,
          image: profile(row.item.id)?.imageUrl ?? null,
          round: true,
        }))
      : topAlbums(props.tracks, metric.value, props.limit).map((row) => ({
          ...row,
          image: row.item.imageUrl,
          round: false,
        }));
  return ranking.map((row) => ({
    key: row.item.id,
    label: row.item.name,
    image: row.image,
    round: row.round,
    sublabel:
      metric.value === "tracks"
        ? formatLongDuration(row.totalMs)
        : t("common.tracks", { n: row.trackCount }, row.trackCount),
    value: metric.value === "tracks" ? row.trackCount : row.totalMs,
    display:
      metric.value === "tracks"
        ? formatNumber(row.trackCount)
        : formatLongDuration(row.totalMs),
  }));
});
</script>

<template>
  <section class="glass panel" :aria-labelledby="id">
    <div class="head">
      <h2 :id="id" class="section-title">
        {{ kind === "artists" ? t("stats.topArtists") : t("stats.topAlbums") }}
      </h2>
      <div class="chips" role="group" :aria-label="t('stats.rankBy')">
        <button
          type="button"
          class="chip"
          :aria-pressed="metric === 'tracks'"
          @click="metric = 'tracks'"
        >
          {{ t("stats.byTracks") }}
        </button>
        <button
          type="button"
          class="chip"
          :aria-pressed="metric === 'minutes'"
          @click="metric = 'minutes'"
        >
          {{ t("stats.byMinutes") }}
        </button>
      </div>
    </div>
    <BarRanking
      :rows="rows"
      :link="kind === 'artists' ? 'artist' : undefined"
    />
    <p v-if="rows.length === 0" class="muted">{{ t("common.noData") }}</p>
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
