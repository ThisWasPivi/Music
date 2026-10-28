<script setup lang="ts">
/**
 * StatsView component
 * Statistics of the whole series or of one playlist: headline figures, top
 * artists and albums, when tracks were added, release years and what is in
 * rotation now.
 */
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import RotationSection from "@/components/playlists/RotationSection.vue";
import ColumnChart, { type Column } from "@/components/stats/ColumnChart.vue";
import HeatmapCalendar from "@/components/stats/HeatmapCalendar.vue";
import TopRankings from "@/components/stats/TopRankings.vue";
import SectionTitle from "@/components/ui/SectionTitle.vue";
import SelectMenu, { type SelectOption } from "@/components/ui/SelectMenu.vue";
import StatTile from "@/components/ui/StatTile.vue";
import { useCatalog } from "@/composables/useCatalog.ts";
import {
  type BucketSize,
  buildAddedHeatmap,
  releaseDistribution,
  summarize,
  tracksOf,
} from "@/services/stats";
import {
  formatLongDuration,
  formatNumber,
  formatPercent,
  formatTrackDuration,
} from "@/utils/format.ts";

const { t } = useI18n();
const { playlists } = useCatalog();

const scopeId = ref<string | null>(null);
const scope = computed(() =>
  scopeId.value === null
    ? playlists
    : playlists.filter((playlist) => playlist.id === scopeId.value),
);
const scopeOptions = computed<SelectOption<string>[]>(() => [
  {
    value: null,
    label: t("stats.wholeSeries"),
    hint: t("home.resultCount", { n: playlists.length }, playlists.length),
  },
  ...playlists.map((playlist) => ({
    value: playlist.id,
    label: playlist.name,
    hint: t("common.tracks", { n: playlist.trackCount }, playlist.trackCount),
    image: playlist.coverUrl,
  })),
]);

const tracks = computed(() => tracksOf(scope.value));
const summary = computed(() => summarize(tracks.value));
const heatmap = computed(() => buildAddedHeatmap(tracks.value));

/* Bucket widths offered for the release-year chart, finest first. */
const BUCKETS: readonly { size: BucketSize; label: string }[] = [
  { size: 1, label: "stats.years" },
  { size: 5, label: "stats.fiveYears" },
  { size: 10, label: "stats.decades" },
];
const bucket = ref<BucketSize>(1);
const columns = computed<Column[]>(() =>
  releaseDistribution(tracks.value, bucket.value).map((entry) => ({
    key: String(entry.key),
    label: `'${String(entry.key).slice(2)}`,
    value: entry.count,
    tooltip: bucketTooltip(entry.key, entry.count),
  })),
);
const labelEvery = computed(() =>
  Math.max(1, Math.ceil(columns.value.length / 12)),
);

/**
 * Describes one release-year bucket for its tooltip.
 * @param start - First year of the bucket
 * @param count - Tracks in it
 * @returns The tooltip text
 */
function bucketTooltip(start: number, count: number): string {
  const tracks = t("common.tracks", { n: count }, count);
  if (bucket.value === 1)
    return t("stats.yearTooltip", { year: start, tracks });
  if (bucket.value === 10)
    return t("stats.decadeTooltip", { decade: start, tracks });
  return t("stats.spanTooltip", {
    from: start,
    to: start + bucket.value - 1,
    tracks,
  });
}

/**
 * Describes a track for a tile detail.
 * @param track - The track, if any
 * @returns "Title · Artist", or an em dash
 */
function describe(track: (typeof summary.value)["longest"]): string {
  return track ? `${track.title} · ${track.artists[0]?.name ?? ""}` : "—";
}
</script>

<template>
  <div class="stack">
    <header class="top">
      <h1 class="page-title">{{ t("stats.title") }}</h1>
      <SelectMenu
        v-model="scopeId"
        :options="scopeOptions"
        :label="t('stats.show')"
        align-end
      />
    </header>

    <div class="tiles">
      <StatTile
        :label="t('stats.tracks')"
        :value="formatNumber(summary.trackCount)"
        :detail="t('stats.unique', { n: summary.uniqueTrackCount })"
      />
      <StatTile
        :label="t('stats.listening')"
        :value="formatLongDuration(summary.totalMs)"
      />
      <StatTile
        :label="t('stats.artists')"
        :value="formatNumber(summary.uniqueArtistCount)"
        :detail="
          t(
            'stats.albums',
            { n: summary.uniqueAlbumCount },
            summary.uniqueAlbumCount,
          )
        "
      />
      <StatTile
        :label="t('stats.average')"
        :value="formatTrackDuration(summary.averageMs)"
      />
      <StatTile
        :label="t('stats.explicit')"
        :value="formatPercent(summary.explicitShare)"
      />
      <StatTile
        :label="t('stats.longest')"
        :value="formatTrackDuration(summary.longest?.durationMs ?? 0)"
        :detail="describe(summary.longest)"
      />
      <StatTile
        :label="t('stats.shortest')"
        :value="formatTrackDuration(summary.shortest?.durationMs ?? 0)"
        :detail="describe(summary.shortest)"
      />
    </div>

    <div class="grid-2">
      <TopRankings :key="`a-${scopeId}`" :tracks="tracks" kind="artists" />
      <TopRankings :key="`b-${scopeId}`" :tracks="tracks" kind="albums" />
    </div>

    <section class="glass panel" aria-labelledby="added-title">
      <SectionTitle
        id="added-title"
        :title="t('stats.addedTitle')"
        :info="t('stats.addedLede')"
      />
      <HeatmapCalendar :key="`h-${scopeId}`" :heatmap="heatmap" />
    </section>

    <section class="glass panel" aria-labelledby="years-title">
      <div class="head">
        <SectionTitle
          id="years-title"
          class="head__title"
          :title="t('stats.yearsTitle')"
          :info="t('stats.yearsInfo')"
        />
        <div class="chips" role="group" :aria-label="t('stats.groupBy')">
          <button
            v-for="option in BUCKETS"
            :key="option.size"
            type="button"
            class="chip"
            :aria-pressed="bucket === option.size"
            @click="bucket = option.size"
          >
            {{ t(option.label) }}
          </button>
        </div>
      </div>
      <ColumnChart
        :key="`c-${bucket}`"
        :columns="columns"
        :label-every="labelEvery"
        :label="t('stats.yearsTitle')"
      />
    </section>

    <RotationSection />
  </div>
</template>

<style scoped>
.top {
  position: relative;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
/* Tiles share each row and the last row stretches, so no tile is left alone. */
.tiles > * {
  flex: 1 1 150px;
}
.head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}
.head__title {
  margin: 0;
}
</style>
