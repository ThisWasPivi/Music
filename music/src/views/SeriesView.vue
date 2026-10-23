<script setup lang="ts">
/**
 * SeriesView component
 * The series over time: real-time release timeline, gaps between issues,
 * new artists per issue, recurring artists and repeated tracks.
 */
import { findMissingIssues } from "@music/shared";
import { computed } from "vue";

import ReleaseTimeline from "@/components/series/ReleaseTimeline.vue";
import ColumnChart, { type Column } from "@/components/stats/ColumnChart.vue";
import StatTile from "@/components/ui/StatTile.vue";
import { useAccent } from "@/composables/useAccent.ts";
import { useCatalog } from "@/composables/useCatalog.ts";
import {
  discoveryByIssue,
  recurringArtists,
  releaseTimeline,
  repeatedTracks,
} from "@/services/stats";
import { formatDate, formatPercent } from "@/utils/format.ts";

const { playlists, issues, latest } = useCatalog();
useAccent(() => latest?.palette);

const timeline = releaseTimeline(issues);
const missing = findMissingIssues(
  issues.flatMap((issue) => (issue.number === null ? [] : [issue.number])),
);
const discovery = discoveryByIssue(playlists);
const recurring = recurringArtists(playlists)
  .filter((row) => row.issueCount > 1)
  .slice(0, 20);
const repeated = repeatedTracks(playlists).slice(0, 20);

const discoveryColumns = computed<Column[]>(() =>
  discovery.map((row) => ({
    key: row.playlist.id,
    label: String(row.playlist.number),
    value: row.newArtists.length,
    title: `Nº ${row.playlist.number}: ${row.newArtists.length} artisti nuovi su ${row.artistCount} (${formatPercent(row.discoveryRate)})`,
  })),
);
const labelEvery = Math.max(1, Math.ceil(discovery.length / 12));

/**
 * Formats a gap in days.
 * @param days - The gap, or null
 * @returns e.g. "12 giorni"
 */
function days(days: number | null | undefined): string {
  if (days === null || days === undefined) return "—";
  const rounded = Math.round(days);
  return `${rounded} ${rounded === 1 ? "giorno" : "giorni"}`;
}
</script>

<template>
  <div class="stack">
    <header>
      <p class="eyebrow">La serie</p>
      <h1 class="page-title">Pivəəkly nel tempo</h1>
    </header>

    <section class="glass panel" aria-labelledby="timeline-title">
      <h2 id="timeline-title" class="section-title">Timeline delle uscite</h2>
      <p class="muted lede">
        Un punto per numero su un asse temporale reale: si vedono i periodi
        fitti e le pause. La data di uscita è approssimata al primo brano
        aggiunto. In evidenza il numero arrivato dopo la pausa più lunga.
      </p>
      <ReleaseTimeline
        v-if="timeline.releases.length > 0"
        :releases="timeline.releases"
        :highlight="timeline.maxGap"
        colored
        :radius="9"
      />
      <div class="tiles">
        <StatTile
          label="Intervallo medio"
          :value="days(timeline.averageGapDays)"
        />
        <StatTile
          label="Intervallo minimo"
          :value="days(timeline.minGap?.gapDays)"
          :detail="
            timeline.minGap
              ? `prima di ${timeline.minGap.playlist.name}`
              : undefined
          "
        />
        <StatTile
          label="Intervallo massimo"
          :value="days(timeline.maxGap?.gapDays)"
          :detail="
            timeline.maxGap
              ? `prima di ${timeline.maxGap.playlist.name}`
              : undefined
          "
        />
        <StatTile
          label="Prima uscita"
          :value="formatDate(timeline.releases[0]?.releasedAt ?? null)"
          :detail="timeline.releases[0]?.playlist.name"
        />
      </div>
      <p v-if="missing.length > 0" class="muted missing">
        Numeri che mancano nella sequenza: {{ missing.join(", ") }}.
      </p>
    </section>

    <section class="glass panel" aria-labelledby="discovery-title">
      <h2 id="discovery-title" class="section-title">Indice di scoperta</h2>
      <p class="muted lede">
        Quanti artisti compaiono per la prima volta in ogni numero.
      </p>
      <ColumnChart
        :columns="discoveryColumns"
        :label-every="labelEvery"
        :height="130"
        label="Artisti nuovi per numero"
      />
    </section>

    <div class="grid-2">
      <section class="glass panel" aria-labelledby="recurring-title">
        <h2 id="recurring-title" class="section-title">Artisti ricorrenti</h2>
        <div class="scroll">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Artista</th>
                <th scope="col">Numeri</th>
                <th scope="col">Primo</th>
                <th scope="col">Ultimo</th>
                <th scope="col">
                  <abbr title="Numeri consecutivi più lunghi">Di fila</abbr>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in recurring" :key="row.artist.id">
                <td>
                  <RouterLink
                    :to="{ name: 'artist', params: { id: row.artist.id } }"
                    >{{ row.artist.name }}</RouterLink
                  >
                </td>
                <td class="tabular">{{ row.issueCount }}</td>
                <td class="tabular">Nº {{ row.firstIssue }}</td>
                <td class="tabular">Nº {{ row.lastIssue }}</td>
                <td class="tabular">{{ row.longestStreak }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="recurring.length === 0" class="muted">
          Nessun artista compare in più di un numero.
        </p>
      </section>

      <section class="glass panel" aria-labelledby="repeated-title">
        <h2 id="repeated-title" class="section-title">Brani ripetuti</h2>
        <ul class="repeats">
          <li v-for="row in repeated" :key="row.track.id">
            <span class="repeats__track">
              <a :href="row.track.url" target="_blank" rel="noopener">{{
                row.track.title
              }}</a>
              <span class="muted">{{
                row.track.artists.map((artist) => artist.name).join(", ")
              }}</span>
            </span>
            <span class="chips repeats__issues">
              <RouterLink
                v-for="issue in row.issues"
                :key="issue"
                :to="{
                  name: 'playlist',
                  params: {
                    id:
                      issues.find((entry) => entry.number === issue)?.id ?? '',
                  },
                }"
                class="chip"
                :aria-label="`Nº ${issue}`"
              >
                {{ issue }}
              </RouterLink>
            </span>
          </li>
        </ul>
        <p v-if="repeated.length === 0" class="muted">
          Nessun brano compare in più di un numero.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lede {
  margin: -6px 0 14px;
  font-size: 14px;
  max-inline-size: 70ch;
}
.tiles {
  display: grid;
  gap: 14px;
  margin-top: 16px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
}
.missing {
  margin: 14px 0 0;
  font-size: 14px;
}
.scroll {
  overflow-x: auto;
}
.table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.table th {
  text-align: left;
  padding: 6px 8px;
  font-weight: 500;
  font-size: 12px;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
}
.table td {
  padding: 8px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
.table a {
  text-decoration: none;
  font-weight: 600;
}
.table abbr {
  text-decoration: none;
}
.repeats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}
.repeats li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}
.repeats__track {
  display: grid;
  min-width: 0;
  font-size: 14px;
}
.repeats__track a {
  font-weight: 600;
  text-decoration: none;
}
.repeats__issues .chip {
  min-block-size: 28px;
  padding: 2px 10px;
}
</style>
