<script setup lang="ts">
/**
 * DirectionIndex component
 * Direction C: brutalist minimal. A visible grid of 2px rules, monospaced
 * data, uppercase labels and one acid-lime highlight. Information first.
 */
import "@fontsource-variable/space-grotesk";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";

import SpotifyMark from "@/components/player/SpotifyMark.vue";
import ReleaseTimeline from "@/components/series/ReleaseTimeline.vue";
import BarRanking from "@/components/stats/BarRanking.vue";
import ColumnChart from "@/components/stats/ColumnChart.vue";
import HeatmapCalendar from "@/components/stats/HeatmapCalendar.vue";
import OverlapMatrix from "@/components/stats/OverlapMatrix.vue";
import {
  formatDate,
  formatLongDuration,
  formatNumber,
  formatPercent,
  formatTrackDuration,
} from "@/utils/format.ts";

import EmbedMock from "../EmbedMock.vue";
import LabScreen from "../LabScreen.vue";
import LogoBars from "../logos/LogoBars.vue";
import { useLabData } from "../useLabData.ts";

defineProps<{
  /** Colour scheme to render. */
  theme: "light" | "dark";

  /** Anchor prefix for the lab navigation. */
  prefix: string;
}>();

const data = useLabData();

/**
 * Zero-pads an issue number to three digits.
 * @param value - The number, or null
 * @returns e.g. "024", or "---" when missing
 */
const pad = (value: number | null): string =>
  value === null ? "---" : String(value).padStart(3, "0");
</script>

<template>
  <div class="ix" :data-theme="theme">
    <LabScreen :id="`${prefix}-sistema`" label="Palette & tipografia">
      <div class="ix__page">
        <div class="ix__row ix__row--3">
          <div class="ix__cell ix__swatch" style="background: var(--bg)">
            <span>BG</span><code>#FFFFFF / #0A0A0A</code>
          </div>
          <div
            class="ix__cell ix__swatch"
            style="background: var(--ink); color: var(--bg)"
          >
            <span>INK</span><code>#0A0A0A / #F0F0F0</code>
          </div>
          <div
            class="ix__cell ix__swatch"
            style="background: var(--lime); color: #0a0a0a"
          >
            <span>LIME</span><code>#C6FF00</code>
          </div>
        </div>
        <div class="ix__row ix__row--2">
          <div class="ix__cell">
            <p class="ix__label">Display / Space Grotesk 700</p>
            <p class="ix__huge">PIVƏƏKLY_024</p>
          </div>
          <div class="ix__cell">
            <p class="ix__label">Data / Space Mono</p>
            <p class="ix__mono">028 TRK / 01:52:10 / 2024-01-14</p>
            <p class="ix__label">Regola</p>
            <p class="ix__mono">
              Bordi 2px. Niente ombre, niente raggi. Il lime solo per stato
              attivo ed evidenza.
            </p>
          </div>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-home`" label="Home / showcase">
      <div class="ix__page">
        <header class="ix__row ix__head">
          <div class="ix__cell ix__brand"><LogoBars class="ix__logo" /></div>
          <nav class="ix__cell ix__menu" aria-label="Principale">
            <a href="#" aria-current="page">[INDICE]</a>
            <a href="#">STATS</a>
            <a href="#">SERIE</a>
          </nav>
          <div class="ix__cell ix__mono ix__count">
            {{ pad(data.issues.length) }} ISSUES /
            {{ formatNumber(data.summary.trackCount) }} TRK
          </div>
        </header>
        <div class="ix__row ix__hero">
          <div class="ix__cell ix__hero-num">
            <p class="ix__label">
              Ultima uscita / {{ formatDate(data.featured.firstAddedAt) }}
            </p>
            <p class="ix__giant">{{ pad(data.featured.number) }}</p>
          </div>
          <div class="ix__cell ix__hero-meta">
            <img :src="data.featured.coverUrl ?? ''" alt="" />
            <div>
              <p class="ix__name">{{ data.featured.name }}</p>
              <p class="ix__mono">
                {{ data.featured.trackCount }} TRK /
                {{ formatLongDuration(data.featured.durationMs) }}
              </p>
              <a href="#" class="ix__btn"><SpotifyMark /> ASCOLTA SU SPOTIFY</a>
            </div>
          </div>
        </div>
        <div class="ix__row ix__filters">
          <label class="ix__cell ix__search"
            ><span class="ix__label">Cerca</span
            ><input type="search" placeholder="_"
          /></label>
          <label class="ix__cell"
            ><span class="ix__label">Artista</span
            ><select>
              <option>*</option>
            </select></label
          >
          <label class="ix__cell">
            <span class="ix__label">Decennio</span>
            <select>
              <option>*</option>
              <option v-for="decade in data.decades" :key="decade">
                {{ decade }}
              </option>
            </select>
          </label>
          <label class="ix__cell">
            <span class="ix__label">Tag</span>
            <select>
              <option>*</option>
              <option v-for="tag in data.tags" :key="tag">{{ tag }}</option>
            </select>
          </label>
          <div class="ix__cell ix__view">
            <span class="ix__label">Vista</span
            ><span><b>TABELLA</b> / griglia</span>
          </div>
        </div>
        <div class="ix__scroll">
          <table class="ix__table">
            <thead>
              <tr>
                <th scope="col" aria-sort="descending">
                  <button type="button" class="ix__on">NR ↓</button>
                </th>
                <th scope="col"><span class="sr-only">Cover</span></th>
                <th scope="col"><button type="button">NOME</button></th>
                <th scope="col"><button type="button">TRK</button></th>
                <th scope="col"><button type="button">DURATA</button></th>
                <th scope="col"><button type="button">USCITA</button></th>
                <th scope="col"><button type="button">AGG.</button></th>
                <th scope="col"><button type="button">COLORE</button></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="playlist in data.playlists.slice(0, 10)"
                :key="playlist.id"
              >
                <td class="ix__mono">{{ pad(playlist.number) }}</td>
                <td>
                  <img
                    :src="playlist.coverUrl ?? ''"
                    alt=""
                    class="ix__thumb"
                  />
                </td>
                <td>
                  <a href="#">{{ playlist.name }}</a>
                </td>
                <td class="ix__mono">{{ playlist.trackCount }}</td>
                <td class="ix__mono">
                  {{ formatLongDuration(playlist.durationMs) }}
                </td>
                <td class="ix__mono">
                  {{ playlist.firstAddedAt?.slice(0, 10) }}
                </td>
                <td class="ix__mono">
                  {{ playlist.lastAddedAt?.slice(0, 10) }}
                </td>
                <td>
                  <span
                    class="ix__chipcolor"
                    :style="{ background: playlist.palette[0] }"
                    :title="playlist.palette[0]"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-playlist`" label="Pagina playlist">
      <div class="ix__page">
        <div class="ix__row ix__pl">
          <div class="ix__cell ix__pl-num">
            <p class="ix__label">Issue</p>
            <p class="ix__giant">{{ pad(data.featured.number) }}</p>
            <img
              :src="data.featured.coverUrl ?? ''"
              alt=""
              class="ix__pl-cover"
            />
          </div>
          <div class="ix__cell ix__pl-info">
            <p class="ix__name ix__name--lg">{{ data.featured.name }}</p>
            <p>{{ data.featured.description }}</p>
            <dl class="ix__dl">
              <dt>TRK</dt>
              <dd>{{ data.featured.trackCount }}</dd>
              <dt>DURATA</dt>
              <dd>{{ formatLongDuration(data.featured.durationMs) }}</dd>
              <dt>USCITA*</dt>
              <dd>{{ data.featured.firstAddedAt?.slice(0, 10) }}</dd>
              <dt>AGG.</dt>
              <dd>{{ data.featured.lastAddedAt?.slice(0, 10) }}</dd>
              <dt>EXPL.</dt>
              <dd>{{ formatPercent(data.featuredSummary.explicitShare) }}</dd>
            </dl>
            <p class="ix__mono ix__small">
              * = primo added_at, approssimazione della data di uscita.
            </p>
            <EmbedMock :playlist="data.featured" />
          </div>
        </div>
        <div class="ix__row ix__filters">
          <label class="ix__cell ix__search"
            ><span class="ix__label">Filtra brani</span
            ><input type="search" placeholder="_"
          /></label>
          <div class="ix__cell ix__view">
            <span class="ix__label">Spotify</span
            ><a href="#" class="ix__btn"><SpotifyMark /> APRI</a>
          </div>
        </div>
        <div class="ix__scroll">
          <table class="ix__table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col"><button type="button">TITOLO</button></th>
                <th scope="col"><button type="button">ARTISTA</button></th>
                <th scope="col"><button type="button">ALBUM</button></th>
                <th scope="col"><button type="button">ANNO</button></th>
                <th scope="col"><button type="button">DUR.</button></th>
                <th scope="col" aria-sort="ascending">
                  <button type="button" class="ix__on">AGGIUNTO ↑</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(track, index) in data.featured.tracks.slice(0, 10)"
                :key="track.id"
              >
                <td class="ix__mono">{{ pad(index + 1) }}</td>
                <td>
                  <a href="#">{{ track.title }}</a>
                  <b v-if="track.explicit" class="ix__e">E</b>
                </td>
                <td>
                  {{ track.artists.map((artist) => artist.name).join(", ") }}
                </td>
                <td>{{ track.album.name }}</td>
                <td class="ix__mono">{{ track.releaseYear }}</td>
                <td class="ix__mono">
                  {{ formatTrackDuration(track.durationMs) }}
                </td>
                <td class="ix__mono">{{ track.addedAt.slice(0, 10) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <nav class="ix__row ix__row--2" aria-label="Serie">
          <a href="#" class="ix__cell ix__pager"
            >&lt;&lt; {{ pad(data.previous?.number ?? null) }}
            {{ data.previous?.name }}</a
          >
          <span class="ix__cell ix__pager ix__pager--off"
            >ULTIMO NUMERO &gt;&gt;</span
          >
        </nav>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-stats`" label="Statistiche">
      <div class="ix__page">
        <div class="ix__row ix__kpis">
          <div class="ix__cell">
            <p class="ix__label">Brani</p>
            <p class="ix__kpi">{{ formatNumber(data.summary.trackCount) }}</p>
          </div>
          <div class="ix__cell">
            <p class="ix__label">Unici</p>
            <p class="ix__kpi">{{ data.summary.uniqueTrackCount }}</p>
          </div>
          <div class="ix__cell">
            <p class="ix__label">Artisti</p>
            <p class="ix__kpi">{{ data.summary.uniqueArtistCount }}</p>
          </div>
          <div class="ix__cell">
            <p class="ix__label">Media</p>
            <p class="ix__kpi">
              {{ formatTrackDuration(data.summary.averageMs) }}
            </p>
          </div>
          <div class="ix__cell ix__cell--lime">
            <p class="ix__label">Expl.</p>
            <p class="ix__kpi">
              {{ formatPercent(data.summary.explicitShare) }}
            </p>
          </div>
        </div>
        <div class="ix__row ix__row--2">
          <div class="ix__cell">
            <p class="ix__label">
              MAX /
              {{ formatTrackDuration(data.summary.longest?.durationMs ?? 0) }}
            </p>
            <p class="ix__name">{{ data.summary.longest?.title }}</p>
          </div>
          <div class="ix__cell">
            <p class="ix__label">
              MIN /
              {{ formatTrackDuration(data.summary.shortest?.durationMs ?? 0) }}
            </p>
            <p class="ix__name">{{ data.summary.shortest?.title }}</p>
          </div>
        </div>
        <div class="ix__row ix__row--3">
          <section class="ix__cell">
            <h2 class="ix__label">Top artisti / brani</h2>
            <BarRanking :rows="data.artistRows" />
          </section>
          <section class="ix__cell">
            <h2 class="ix__label">Top artisti / minuti</h2>
            <BarRanking :rows="data.artistMinuteRows" />
          </section>
          <section class="ix__cell">
            <h2 class="ix__label">Top album / brani</h2>
            <BarRanking :rows="data.albumRows" />
          </section>
        </div>
        <section class="ix__row">
          <div class="ix__cell">
            <h2 class="ix__label">added_at / heatmap</h2>
            <HeatmapCalendar :heatmap="data.heatmap" :gap="2" />
          </div>
        </section>
        <div class="ix__row ix__row--2">
          <section class="ix__cell">
            <h2 class="ix__label">Release / decennio</h2>
            <ColumnChart
              :columns="data.decadeColumns"
              label="Brani per decennio di uscita"
            />
          </section>
          <section class="ix__cell">
            <h2 class="ix__label">Jaccard / artisti / ultimi 10</h2>
            <OverlapMatrix
              :matrix="data.overlap"
              :labels="data.overlapLabels"
              :cell="24"
            />
          </section>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-serie`" label="Serie & timeline">
      <div class="ix__page">
        <section class="ix__row">
          <div class="ix__cell">
            <h2 class="ix__label">Timeline / asse reale</h2>
            <ReleaseTimeline
              :releases="data.timeline.releases"
              :highlight="data.timeline.maxGap"
              :radius="6"
            />
          </div>
        </section>
        <div class="ix__row ix__row--3">
          <div class="ix__cell">
            <p class="ix__label">Δ medio</p>
            <p class="ix__kpi">
              {{ Math.round(data.timeline.averageGapDays ?? 0) }}D
            </p>
          </div>
          <div class="ix__cell">
            <p class="ix__label">
              Δ min / → {{ pad(data.timeline.minGap?.playlist.number ?? null) }}
            </p>
            <p class="ix__kpi">
              {{ Math.round(data.timeline.minGap?.gapDays ?? 0) }}D
            </p>
          </div>
          <div class="ix__cell ix__cell--lime">
            <p class="ix__label">
              Δ max / → {{ pad(data.timeline.maxGap?.playlist.number ?? null) }}
            </p>
            <p class="ix__kpi">
              {{ Math.round(data.timeline.maxGap?.gapDays ?? 0) }}D
            </p>
          </div>
        </div>
        <section class="ix__row">
          <div class="ix__cell">
            <h2 class="ix__label">Scoperta / nuovi artisti per issue</h2>
            <ColumnChart
              :columns="data.discoveryColumns"
              label="Nuovi artisti per numero"
              :height="110"
            />
          </div>
        </section>
        <div class="ix__row ix__row--2">
          <section class="ix__cell ix__scroll">
            <h2 class="ix__label">Ricorrenti</h2>
            <table class="ix__table ix__table--plain">
              <thead>
                <tr>
                  <th scope="col">ARTISTA</th>
                  <th scope="col">N</th>
                  <th scope="col">FIRST</th>
                  <th scope="col">LAST</th>
                  <th scope="col">STREAK</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in data.recurring" :key="row.artist.id">
                  <td>{{ row.artist.name }}</td>
                  <td class="ix__mono">{{ row.issueCount }}</td>
                  <td class="ix__mono">{{ pad(row.firstIssue) }}</td>
                  <td class="ix__mono">{{ pad(row.lastIssue) }}</td>
                  <td class="ix__mono">{{ row.longestStreak }}</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section class="ix__cell">
            <h2 class="ix__label">Ripetuti</h2>
            <ul class="ix__list">
              <li v-for="row in data.repeated" :key="row.track.id">
                <span>{{ row.track.title }}</span>
                <span class="ix__mono">{{
                  row.issues.map((issue) => pad(issue)).join(" ")
                }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </LabScreen>
  </div>
</template>

<style scoped>
.ix {
  --bg: #ffffff;
  --ink: #0a0a0a;
  --lime: #c6ff00;
  --dim: #6a6a6a;
  --rule: 2px solid var(--ink);
  --grotesk: "Space Grotesk Variable", system-ui, sans-serif;
  --mono: "Space Mono", ui-monospace, monospace;
  --chart-ink: var(--ink);
  --chart-muted: var(--dim);
  --chart-grid: var(--ink);
  --chart-accent: var(--lime);
  --chart-bg: var(--bg);
  --bar: var(--ink);
  --bar-highlight: var(--lime);
  --bar-track: transparent;
  --bar-size: 10px;
  --bar-radius: 0;
  --matrix-hi: var(--ink);
  --matrix-lo: var(--lime);
  --heat-0: color-mix(in oklab, var(--ink) 7%, var(--bg));
  --heat-1: color-mix(in oklab, var(--ink) 30%, var(--bg));
  --heat-2: color-mix(in oklab, var(--ink) 55%, var(--bg));
  --heat-3: color-mix(in oklab, var(--ink) 80%, var(--bg));
  --heat-4: var(--lime);
  --logo-accent: var(--ink);
  --focus: var(--ink);
}
.ix[data-theme="dark"] {
  --bg: #0a0a0a;
  --ink: #f0f0f0;
  --dim: #9a9a9a;
  --logo-accent: var(--lime);
}
.ix__page {
  background: var(--bg);
  color: var(--ink);
  font: 15px/1.4 var(--grotesk);
  border: var(--rule);
}
.ix__row {
  display: grid;
  border-bottom: var(--rule);
}
.ix__row:last-child {
  border-bottom: 0;
}
.ix__cell {
  padding: 14px 16px;
  border-inline-end: var(--rule);
  min-width: 0;
}
.ix__cell:last-child {
  border-inline-end: 0;
}
@media (max-width: 759px) {
  .ix__cell {
    border-inline-end: 0;
    border-bottom: var(--rule);
  }
  .ix__cell:last-child {
    border-bottom: 0;
  }
}
@media (min-width: 760px) {
  .ix__row--2 {
    grid-template-columns: 1fr 1fr;
  }
  .ix__row--3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
.ix__cell--lime {
  background: var(--lime);
  color: #0a0a0a;
  --chart-muted: #0a0a0a;
}
.ix__label {
  margin: 0 0 10px;
  font: 700 11px/1.2 var(--mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.ix__mono {
  margin: 0;
  font-family: var(--mono);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.ix__small {
  font-size: 11px;
  color: var(--dim);
}
.ix__huge {
  margin: 0;
  font: 700 clamp(36px, 6vw, 72px) / 0.9 var(--grotesk);
  letter-spacing: -0.04em;
  word-break: break-all;
}
.ix__giant {
  margin: 0;
  font: 700 clamp(120px, 22vw, 280px) / 0.8 var(--grotesk);
  letter-spacing: -0.06em;
}
.ix__swatch {
  display: flex;
  justify-content: space-between;
  align-items: end;
  min-block-size: 120px;
  font: 700 14px var(--mono);
}
.ix__swatch code {
  font-size: 11px;
}
.ix__head {
  grid-template-columns: auto 1fr auto;
  align-items: center;
}
.ix__logo {
  block-size: 26px;
}
.ix__menu {
  display: flex;
  gap: 18px;
  font: 700 13px var(--mono);
}
.ix__menu a {
  color: inherit;
  text-decoration: none;
}
.ix__menu a[aria-current="page"] {
  background: var(--lime);
  color: #0a0a0a;
  padding: 0 4px;
}
.ix__count {
  font-size: 12px;
}
.ix__hero {
  grid-template-columns: 1fr;
}
@media (min-width: 760px) {
  .ix__hero {
    grid-template-columns: 3fr 2fr;
  }
}
.ix__hero-meta {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 14px;
  align-content: end;
}
.ix__hero-meta img {
  inline-size: 120px;
  aspect-ratio: 1;
  border: var(--rule);
}
.ix__name {
  margin: 0 0 6px;
  font: 700 22px/1.1 var(--grotesk);
}
.ix__name--lg {
  font-size: clamp(28px, 4vw, 48px);
}
.ix__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  border: var(--rule);
  font: 700 12px var(--mono);
  color: inherit;
  text-decoration: none;
}
.ix__btn:hover {
  background: var(--lime);
  color: #0a0a0a;
}
.ix__filters {
  grid-template-columns: 1fr;
}
@media (min-width: 760px) {
  .ix__filters {
    grid-template-columns: 2fr repeat(4, 1fr);
  }
}
.ix__filters label,
.ix__view {
  display: grid;
}
.ix__filters input,
.ix__filters select {
  font: 700 15px var(--mono);
  background: transparent;
  color: inherit;
  border: 0;
  padding: 0;
}
.ix__view {
  font: 13px var(--mono);
}
.ix__scroll {
  overflow-x: auto;
}
.ix__table {
  inline-size: 100%;
  border-collapse: collapse;
  min-inline-size: 640px;
}
.ix__table th {
  text-align: left;
  padding: 0;
  border-bottom: var(--rule);
}
.ix__table th button,
.ix__table th:not(:has(button)) {
  font: 700 11px var(--mono);
  padding: 8px 10px;
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
}
.ix__table th button.ix__on {
  background: var(--lime);
  color: #0a0a0a;
}
.ix__table td {
  padding: 6px 10px;
  border-bottom: 1px solid var(--ink);
}
.ix__table tbody tr:hover {
  background: var(--lime);
  color: #0a0a0a;
}
.ix__table a {
  color: inherit;
  font-weight: 700;
  text-decoration: none;
}
.ix__table--plain {
  min-inline-size: 0;
}
.ix__table--plain th {
  padding: 6px 8px 6px 0;
  font: 700 11px var(--mono);
}
.ix__thumb {
  inline-size: 36px;
  block-size: 36px;
  display: block;
}
.ix__chipcolor {
  display: inline-block;
  inline-size: 28px;
  block-size: 14px;
  border: 1px solid var(--ink);
}
.ix__e {
  font: 700 10px var(--mono);
  border: 1px solid currentColor;
  padding: 0 3px;
}
.ix__pl {
  grid-template-columns: 1fr;
}
@media (min-width: 860px) {
  .ix__pl {
    grid-template-columns: 2fr 3fr;
  }
}
.ix__pl-cover {
  inline-size: 100%;
  max-inline-size: 280px;
  margin-top: 16px;
  border: var(--rule);
}
.ix__pl-info {
  display: grid;
  gap: 12px;
  align-content: start;
  --embed-radius: 0;
}
.ix__pl-info p {
  margin: 0;
}
.ix__dl {
  display: grid;
  grid-template-columns: auto 1fr;
  margin: 0;
  font: 13px var(--mono);
  border-top: var(--rule);
}
.ix__dl dt,
.ix__dl dd {
  margin: 0;
  padding: 6px 10px 6px 0;
  border-bottom: 1px solid var(--ink);
}
.ix__dl dt {
  font-weight: 700;
}
.ix__pager {
  font: 700 14px var(--mono);
  color: inherit;
  text-decoration: none;
}
a.ix__pager:hover {
  background: var(--lime);
  color: #0a0a0a;
}
.ix__pager--off {
  color: var(--dim);
  text-align: right;
}
.ix__kpis {
  grid-template-columns: repeat(2, 1fr);
}
@media (min-width: 760px) {
  .ix__kpis {
    grid-template-columns: repeat(5, 1fr);
  }
}
.ix__kpi {
  margin: 0;
  font: 700 clamp(32px, 5vw, 56px) / 1 var(--grotesk);
  letter-spacing: -0.04em;
}
.ix__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ix__list li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--ink);
}
.sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
