<script setup lang="ts">
/**
 * StatsView component
 * Statistics of the whole series or of one issue: headline figures, top
 * artists and albums, when tracks were added, release years and the
 * overlap between issues.
 */
import { computed, ref } from "vue";

import ColumnChart, { type Column } from "@/components/stats/ColumnChart.vue";
import HeatmapCalendar from "@/components/stats/HeatmapCalendar.vue";
import OverlapPanel from "@/components/stats/OverlapPanel.vue";
import TopRankings from "@/components/stats/TopRankings.vue";
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

const { playlists, issues, latest } = useCatalog();
useAccent(() => latest?.palette);

const scopeId = ref<string>("all");
const scope = computed(() =>
  scopeId.value === "all"
    ? playlists
    : playlists.filter((playlist) => playlist.id === scopeId.value),
);
const tracks = computed(() => tracksOf(scope.value));
const summary = computed(() => summarize(tracks.value));
const heatmap = computed(() => buildAddedHeatmap(tracksOf(playlists)));

const bucket = ref<1 | 10>(10);
const columns = computed<Column[]>(() =>
  releaseDistribution(tracks.value, bucket.value).map((entry) => ({
    key: String(entry.key),
    label:
      bucket.value === 10
        ? `'${String(entry.key).slice(2)}`
        : `'${String(entry.key).slice(2)}`,
    value: entry.count,
    title:
      bucket.value === 10
        ? `Anni ${entry.key}: ${entry.count} brani`
        : `${entry.key}: ${entry.count} brani`,
  })),
);
const labelEvery = computed(() =>
  bucket.value === 1 ? Math.max(1, Math.ceil(columns.value.length / 12)) : 1,
);
</script>

<template>
  <div class="stack">
    <header class="top">
      <div>
        <p class="eyebrow">Statistiche</p>
        <h1 class="page-title">
          I numeri <span class="grad">dei numeri</span>
        </h1>
      </div>
      <label class="scope">
        <span class="muted">Mostra</span>
        <select id="stats-scope" v-model="scopeId" class="chip">
          <option value="all">Tutta la serie</option>
          <option
            v-for="playlist in playlists"
            :key="playlist.id"
            :value="playlist.id"
          >
            {{ playlist.name }}
          </option>
        </select>
      </label>
    </header>

    <div class="tiles">
      <StatTile
        label="Brani"
        :value="formatNumber(summary.trackCount)"
        :detail="`${summary.uniqueTrackCount} diversi`"
      />
      <StatTile label="Ascolto" :value="formatLongDuration(summary.totalMs)" />
      <StatTile
        label="Artisti unici"
        :value="formatNumber(summary.uniqueArtistCount)"
        :detail="`${summary.uniqueAlbumCount} album`"
      />
      <StatTile
        label="Durata media"
        :value="formatTrackDuration(summary.averageMs)"
      />
      <StatTile
        label="Espliciti"
        :value="formatPercent(summary.explicitShare)"
      />
      <StatTile
        label="Più lungo"
        :value="formatTrackDuration(summary.longest?.durationMs ?? 0)"
        :detail="
          summary.longest
            ? `${summary.longest.title} · ${summary.longest.artists[0]?.name ?? ''}`
            : '—'
        "
      />
      <StatTile
        label="Più corto"
        :value="formatTrackDuration(summary.shortest?.durationMs ?? 0)"
        :detail="
          summary.shortest
            ? `${summary.shortest.title} · ${summary.shortest.artists[0]?.name ?? ''}`
            : '—'
        "
      />
    </div>

    <div class="grid-2">
      <TopRankings :key="`a-${scopeId}`" :tracks="tracks" kind="artists" />
      <TopRankings :key="`b-${scopeId}`" :tracks="tracks" kind="albums" />
    </div>

    <section class="glass panel" aria-labelledby="added-title">
      <h2 id="added-title" class="section-title">Quando aggiungo i brani</h2>
      <p class="muted lede">
        Ogni quadrato è un giorno, dall'inizio della serie: più acceso, più
        brani aggiunti.
      </p>
      <HeatmapCalendar :heatmap="heatmap" />
    </section>

    <section class="glass panel" aria-labelledby="years-title">
      <div class="head">
        <h2 id="years-title" class="section-title">Anno di uscita dei brani</h2>
        <div class="chips" role="group" aria-label="Raggruppa per">
          <button
            type="button"
            class="chip"
            :aria-pressed="bucket === 10"
            @click="bucket = 10"
          >
            decennio
          </button>
          <button
            type="button"
            class="chip"
            :aria-pressed="bucket === 1"
            @click="bucket = 1"
          >
            anno
          </button>
        </div>
      </div>
      <ColumnChart
        :columns="columns"
        :label-every="labelEvery"
        label="Distribuzione dei brani per anno di uscita"
      />
    </section>

    <OverlapPanel v-if="issues.length > 1" :issues="issues" />
  </div>
</template>

<style scoped>
.top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
}
.scope {
  display: flex;
  align-items: center;
  gap: 8px;
  max-inline-size: 100%;
}
.scope select {
  max-inline-size: 70vw;
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
