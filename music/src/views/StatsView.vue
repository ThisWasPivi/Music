<script setup lang="ts">
/**
 * StatsView component
 * Statistics of the whole series or of one issue: headline figures, top
 * artists and albums, when tracks were added, release years and what is in
 * rotation now.
 */
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import RotationSection from "@/components/playlists/RotationSection.vue";
import ColumnChart, { type Column } from "@/components/stats/ColumnChart.vue";
import HeatmapCalendar from "@/components/stats/HeatmapCalendar.vue";
import TopRankings from "@/components/stats/TopRankings.vue";
import SelectMenu, { type SelectOption } from "@/components/ui/SelectMenu.vue";
import StatTile from "@/components/ui/StatTile.vue";
import { useAccent } from "@/composables/useAccent.ts";
import { useCatalog } from "@/composables/useCatalog.ts";
import {
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
const { playlists, latest } = useCatalog();

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
useAccent(() =>
  scope.value.length === 1 ? scope.value[0]?.palette : latest?.palette,
);

const tracks = computed(() => tracksOf(scope.value));
const summary = computed(() => summarize(tracks.value));
const heatmap = computed(() => buildAddedHeatmap(tracks.value));

const bucket = ref<1 | 10>(10);
const columns = computed<Column[]>(() =>
  releaseDistribution(tracks.value, bucket.value).map((entry) => ({
    key: String(entry.key),
    label: `'${String(entry.key).slice(2)}`,
    value: entry.count,
    tooltip:
      bucket.value === 10
        ? t("stats.decadeTooltip", {
            decade: entry.key,
            tracks: t("common.tracks", { n: entry.count }, entry.count),
          })
        : t("stats.yearTooltip", {
            year: entry.key,
            tracks: t("common.tracks", { n: entry.count }, entry.count),
          }),
  })),
);
const labelEvery = computed(() =>
  bucket.value === 1 ? Math.max(1, Math.ceil(columns.value.length / 12)) : 1,
);

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
      <h1 class="page-title">{{ t("nav.stats") }}</h1>
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
      <h2 id="added-title" class="section-title">
        {{ t("stats.addedTitle") }}
      </h2>
      <p class="muted lede">{{ t("stats.addedLede") }}</p>
      <HeatmapCalendar :key="`h-${scopeId}`" :heatmap="heatmap" />
    </section>

    <section class="glass panel" aria-labelledby="years-title">
      <div class="head">
        <h2 id="years-title" class="section-title">
          {{ t("stats.yearsTitle") }}
        </h2>
        <div class="chips" role="group" :aria-label="t('stats.groupBy')">
          <button
            type="button"
            class="chip"
            :aria-pressed="bucket === 10"
            @click="bucket = 10"
          >
            {{ t("stats.decades") }}
          </button>
          <button
            type="button"
            class="chip"
            :aria-pressed="bucket === 1"
            @click="bucket = 1"
          >
            {{ t("stats.years") }}
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
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
}
.head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}
.head .section-title {
  margin: 0;
}
.lede {
  margin: -6px 0 14px;
  font-size: 14px;
}
</style>
