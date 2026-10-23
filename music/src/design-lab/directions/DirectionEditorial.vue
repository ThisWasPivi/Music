<script setup lang="ts">
/**
 * DirectionEditorial component
 * Direction A: a typographic fanzine. Paper and ink, a single vermilion
 * accent, oversized serif issue numbers and monospaced metadata.
 */
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";

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
const SWATCHES = [
  { name: "Carta", token: "--paper" },
  { name: "Inchiostro", token: "--ink" },
  { name: "Grafite", token: "--muted" },
  { name: "Vermiglio", token: "--accent" },
  { name: "Velina", token: "--soft" },
];
const SORTS = ["Numero ↓", "Nome", "Brani", "Durata", "Aggiornata", "Colore"];
</script>

<template>
  <div class="ed" :data-theme="theme">
    <LabScreen :id="`${prefix}-sistema`" label="Palette & tipografia">
      <div class="ed__page ed__system">
        <div class="ed__swatches">
          <div
            v-for="swatch in SWATCHES"
            :key="swatch.token"
            class="ed__swatch"
          >
            <span :style="{ background: `var(${swatch.token})` }" />
            <strong>{{ swatch.name }}</strong>
            <code>{{ swatch.token }}</code>
          </div>
        </div>
        <div class="ed__specimen">
          <p class="ed__kicker">Display — Instrument Serif</p>
          <p class="ed__display">Pivəəkly <em>Nº 24</em></p>
          <p class="ed__kicker">Testo — Instrument Sans</p>
          <p class="ed__lead">
            Una playlist ogni tanto, quando c'è abbastanza musica da dire.
            Numerate, irregolari, dal 2024.
          </p>
          <p class="ed__kicker">Dati — JetBrains Mono</p>
          <p class="ed__mono">28 brani · 1 h 52 min · 14 gen 2024</p>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-home`" label="Home / showcase">
      <div class="ed__page">
        <header class="ed__mast">
          <LogoBars class="ed__logo" />
          <nav class="ed__nav" aria-label="Principale">
            <a href="#" aria-current="page">Numeri</a>
            <a href="#">Statistiche</a>
            <a href="#">Serie</a>
          </nav>
        </header>
        <h1 class="ed__title">Pivəəkly</h1>
        <p class="ed__dek">
          {{ data.issues.length }} numeri,
          {{ formatNumber(data.summary.trackCount) }} brani,
          {{ formatLongDuration(data.summary.totalMs) }} di musica. Escono
          quando escono.
        </p>

        <article class="ed__cover-story">
          <img
            :src="data.featured.coverUrl ?? ''"
            alt=""
            class="ed__cover-img"
          />
          <div>
            <p class="ed__kicker">
              Ultimo numero · uscito il
              {{ formatDate(data.featured.firstAddedAt) }}
            </p>
            <h2 class="ed__issue">Nº {{ data.featured.number }}</h2>
            <p class="ed__lead">{{ data.featured.description }}</p>
            <p class="ed__mono">
              {{ data.featured.trackCount }} brani ·
              {{ formatLongDuration(data.featured.durationMs) }} ·
              {{ data.featured.tags.join(" / ") }}
            </p>
            <a class="ed__spotify" href="#"
              ><SpotifyMark /> Ascolta su Spotify</a
            >
          </div>
        </article>

        <div class="ed__toolbar">
          <label class="ed__search">
            <span class="sr-only">Cerca</span>
            <input
              type="search"
              placeholder="Cerca un brano, un artista, un numero…"
            />
          </label>
          <p class="ed__sorts">
            <span>Ordina:</span>
            <button
              v-for="(sort, index) in SORTS"
              :key="sort"
              type="button"
              :aria-pressed="index === 0"
            >
              {{ sort }}
            </button>
          </p>
          <p class="ed__filters">
            <span>Filtra:</span>
            <select aria-label="Artista">
              <option>Tutti gli artisti</option>
            </select>
            <select aria-label="Decennio">
              <option>Ogni decennio</option>
              <option v-for="decade in data.decades" :key="decade">
                Anni {{ decade }}
              </option>
            </select>
            <select aria-label="Tag">
              <option>Ogni mood</option>
              <option v-for="tag in data.tags" :key="tag">{{ tag }}</option>
            </select>
          </p>
        </div>

        <ol class="ed__toc">
          <li v-for="playlist in data.playlists.slice(1, 9)" :key="playlist.id">
            <span class="ed__toc-num">{{ playlist.number ?? "—" }}</span>
            <span class="ed__toc-body">
              <a href="#" class="ed__toc-name">{{ playlist.name }}</a>
              <span class="ed__mono">
                {{ playlist.trackCount }} brani ·
                {{ formatLongDuration(playlist.durationMs) }} ·
                {{ formatDate(playlist.firstAddedAt) }}
              </span>
            </span>
            <img :src="playlist.coverUrl ?? ''" alt="" class="ed__toc-cover" />
          </li>
        </ol>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-playlist`" label="Pagina playlist">
      <div class="ed__page">
        <div class="ed__pl">
          <aside class="ed__pl-side">
            <img
              :src="data.featured.coverUrl ?? ''"
              alt=""
              class="ed__pl-cover"
            />
            <EmbedMock :playlist="data.featured" />
            <a class="ed__spotify" href="#"><SpotifyMark /> Apri su Spotify</a>
          </aside>
          <div>
            <p class="ed__kicker">
              Nº {{ data.featured.number }} · uscito il ≈
              {{ formatDate(data.featured.firstAddedAt) }}
              <abbr
                title="Data del primo brano aggiunto: Spotify non espone la data di pubblicazione"
                >ⓘ</abbr
              >
            </p>
            <h1 class="ed__title ed__title--pl">{{ data.featured.name }}</h1>
            <p class="ed__lead">{{ data.featured.description }}</p>
            <p class="ed__mono">
              {{ data.featured.trackCount }} brani ·
              {{ formatLongDuration(data.featured.durationMs) }} · aggiornata il
              {{ formatDate(data.featured.lastAddedAt) }}
            </p>
            <div class="ed__toolbar ed__toolbar--inline">
              <input
                type="search"
                placeholder="Filtra i brani…"
                aria-label="Filtra i brani"
              />
              <p class="ed__sorts">
                <span>Ordina:</span>
                <button type="button" aria-pressed="true">Ordine</button>
                <button type="button">Titolo</button>
                <button type="button">Artista</button>
                <button type="button">Album</button>
                <button type="button">Anno</button>
                <button type="button">Durata</button>
                <button type="button">Aggiunto</button>
              </p>
            </div>
            <ol class="ed__tracks">
              <li
                v-for="(track, index) in data.featured.tracks.slice(0, 10)"
                :key="track.id"
              >
                <span class="ed__track-n">{{
                  String(index + 1).padStart(2, "0")
                }}</span>
                <span>
                  <span class="ed__track-title">{{ track.title }}</span>
                  <span class="ed__track-sub">
                    {{ track.artists.map((artist) => artist.name).join(", ") }}
                    — <i>{{ track.album.name }}</i
                    >, {{ track.releaseYear }}
                  </span>
                </span>
                <span class="ed__mono">
                  <b v-if="track.explicit" class="ed__e" title="Esplicito">E</b>
                  {{ formatTrackDuration(track.durationMs) }}
                </span>
              </li>
            </ol>
            <nav class="ed__pager" aria-label="Serie">
              <a href="#">← Nº {{ data.previous?.number }}</a>
              <span class="ed__mono"
                >{{ data.featured.number }} / {{ data.issues.length }}</span
              >
              <span aria-disabled="true"
                >Nº {{ (data.featured.number ?? 0) + 1 }} →</span
              >
            </nav>
          </div>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-stats`" label="Statistiche">
      <div class="ed__page">
        <h1 class="ed__title ed__title--sm">I numeri dei numeri</h1>
        <dl class="ed__figures">
          <div>
            <dt>Brani</dt>
            <dd>{{ formatNumber(data.summary.trackCount) }}</dd>
          </div>
          <div>
            <dt>Artisti unici</dt>
            <dd>{{ data.summary.uniqueArtistCount }}</dd>
          </div>
          <div>
            <dt>Durata media</dt>
            <dd>{{ formatTrackDuration(data.summary.averageMs) }}</dd>
          </div>
          <div>
            <dt>Espliciti</dt>
            <dd>{{ formatPercent(data.summary.explicitShare) }}</dd>
          </div>
        </dl>
        <p class="ed__mono">
          Il più lungo: {{ data.summary.longest?.title }} ({{
            formatTrackDuration(data.summary.longest?.durationMs ?? 0)
          }}) · il più corto: {{ data.summary.shortest?.title }} ({{
            formatTrackDuration(data.summary.shortest?.durationMs ?? 0)
          }})
        </p>
        <div class="ed__cols">
          <section>
            <h2 class="ed__h2">Artisti, per brani</h2>
            <BarRanking :rows="data.artistRows" />
          </section>
          <section>
            <h2 class="ed__h2">Artisti, per minuti</h2>
            <BarRanking :rows="data.artistMinuteRows" />
          </section>
          <section>
            <h2 class="ed__h2">Album</h2>
            <BarRanking :rows="data.albumRows" />
          </section>
        </div>
        <section>
          <h2 class="ed__h2">Quando aggiungo i brani</h2>
          <HeatmapCalendar :heatmap="data.heatmap" />
        </section>
        <div class="ed__cols ed__cols--2">
          <section>
            <h2 class="ed__h2">Anno di uscita, per decennio</h2>
            <ColumnChart
              :columns="data.decadeColumns"
              label="Distribuzione dei brani per decennio di uscita"
            />
          </section>
          <section>
            <h2 class="ed__h2">Somiglianza tra numeri (Jaccard, artisti)</h2>
            <OverlapMatrix
              :matrix="data.overlap"
              :labels="data.overlapLabels"
            />
          </section>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-serie`" label="Serie & timeline">
      <div class="ed__page">
        <h1 class="ed__title ed__title--sm">La serie, nel tempo</h1>
        <p class="ed__lead">
          Ogni punto è un numero, alla data del primo brano aggiunto. Nessuna
          cadenza: solo quando c'era qualcosa da dire.
        </p>
        <ReleaseTimeline
          :releases="data.timeline.releases"
          :highlight="data.timeline.maxGap"
        />
        <div class="ed__quotes">
          <blockquote>
            <span>{{ Math.round(data.timeline.averageGapDays ?? 0) }}</span>
            giorni in media tra un numero e l'altro
          </blockquote>
          <blockquote>
            <span>{{ Math.round(data.timeline.minGap?.gapDays ?? 0) }}</span> il
            minimo, prima del Nº {{ data.timeline.minGap?.playlist.number }}
          </blockquote>
          <blockquote>
            <span>{{ Math.round(data.timeline.maxGap?.gapDays ?? 0) }}</span> la
            pausa più lunga, prima del Nº
            {{ data.timeline.maxGap?.playlist.number }}
          </blockquote>
        </div>
        <section>
          <h2 class="ed__h2">Indice di scoperta: artisti nuovi per numero</h2>
          <ColumnChart
            :columns="data.discoveryColumns"
            label="Nuovi artisti per numero"
            :height="120"
          />
        </section>
        <div class="ed__cols ed__cols--2">
          <section>
            <h2 class="ed__h2">Gli habitué</h2>
            <table class="ed__table">
              <thead>
                <tr>
                  <th scope="col">Artista</th>
                  <th scope="col">Numeri</th>
                  <th scope="col">Dal–al</th>
                  <th scope="col">Serie</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in data.recurring" :key="row.artist.id">
                  <td>{{ row.artist.name }}</td>
                  <td>{{ row.issueCount }}</td>
                  <td>{{ row.firstIssue }}–{{ row.lastIssue }}</td>
                  <td>{{ row.longestStreak }} di fila</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section>
            <h2 class="ed__h2">Tornati più volte</h2>
            <ul class="ed__repeats">
              <li v-for="row in data.repeated" :key="row.track.id">
                <span class="ed__track-title">{{ row.track.title }}</span>
                <span class="ed__track-sub">{{
                  row.track.artists[0]?.name
                }}</span>
                <span class="ed__mono">Nº {{ row.issues.join(", ") }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </LabScreen>
  </div>
</template>

<style scoped>
.ed {
  --paper: #f3eee4;
  --ink: #1a1714;
  --muted: #6b6258;
  --accent: #c8351b;
  --soft: #e6dfd0;
  --serif: "Instrument Serif", Georgia, serif;
  --sans: "Instrument Sans Variable", system-ui, sans-serif;
  --mono: "JetBrains Mono Variable", ui-monospace, monospace;
  --chart-ink: var(--ink);
  --chart-muted: var(--muted);
  --chart-grid: color-mix(in oklab, var(--ink) 25%, transparent);
  --chart-accent: var(--accent);
  --chart-bg: var(--paper);
  --bar: var(--ink);
  --bar-highlight: var(--accent);
  --bar-track: var(--soft);
  --bar-size: 3px;
  --matrix-hi: var(--accent);
  --matrix-lo: var(--ink);
  --heat-0: var(--soft);
  --heat-1: color-mix(in oklab, var(--accent) 30%, var(--soft));
  --heat-2: color-mix(in oklab, var(--accent) 55%, var(--soft));
  --heat-3: color-mix(in oklab, var(--accent) 80%, var(--soft));
  --heat-4: var(--accent);
  --logo-accent: var(--accent);
  --focus: var(--accent);
}
.ed[data-theme="dark"] {
  --paper: #15130f;
  --ink: #efe7d9;
  --muted: #a69d8f;
  --accent: #ff6a4a;
  --soft: #2a261f;
}
.ed__page > * {
  min-width: 0;
}
.ed__page {
  grid-template-columns: minmax(0, 1fr);
  background: var(--paper);
  color: var(--ink);
  font-family: var(--sans);
  padding: clamp(20px, 4vw, 56px);
  display: grid;
  gap: 28px;
}
.ed__system {
  grid-template-columns: 1fr;
}
@media (min-width: 800px) {
  .ed__system {
    grid-template-columns: 1fr 2fr;
  }
}
.ed__swatches {
  display: grid;
  gap: 10px;
}
.ed__swatch {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 12px;
}
.ed__swatch span {
  inline-size: 44px;
  block-size: 44px;
  border: 1px solid var(--ink);
}
.ed__swatch code {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}
.ed__kicker {
  margin: 0;
  font: 500 12px/1.4 var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.ed__kicker abbr {
  text-decoration: none;
  cursor: help;
}
.ed__display {
  margin: 4px 0 16px;
  font: 400 clamp(48px, 8vw, 96px) / 0.95 var(--serif);
}
.ed__display em {
  color: var(--accent);
}
.ed__lead {
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
  max-inline-size: 60ch;
}
.ed__mono {
  margin: 0;
  font: 400 13px/1.5 var(--mono);
  color: var(--muted);
}
.ed__mast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid var(--ink);
  padding-bottom: 12px;
}
.ed__logo {
  block-size: 30px;
}
.ed__nav {
  display: flex;
  gap: 20px;
  font: 500 13px var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.ed__nav a {
  color: inherit;
  text-decoration: none;
}
.ed__nav a[aria-current="page"] {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 6px;
}
.ed__title {
  margin: 0;
  font: 400 clamp(64px, 14vw, 200px) / 0.85 var(--serif);
  letter-spacing: -0.02em;
}
.ed__title--pl {
  font-size: clamp(44px, 7vw, 96px);
}
.ed__title--sm {
  font-size: clamp(40px, 6vw, 80px);
}
.ed__dek {
  margin: -12px 0 0;
  font: italic 400 clamp(20px, 2.4vw, 28px) / 1.3 var(--serif);
  max-inline-size: 40ch;
}
.ed__cover-story {
  display: grid;
  gap: 24px;
  border-block: 1px solid var(--ink);
  padding-block: 24px;
}
@media (min-width: 760px) {
  .ed__cover-story {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: end;
  }
}
.ed__cover-img {
  inline-size: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  filter: grayscale(0.15) contrast(1.05);
}
.ed__issue {
  margin: 8px 0 12px;
  font: 400 clamp(96px, 16vw, 220px) / 0.8 var(--serif);
  color: var(--accent);
}
.ed__spotify {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: inherit;
  font: 500 13px var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid currentColor;
  text-decoration: none;
}
.ed__toolbar {
  display: grid;
  gap: 10px;
}
.ed__toolbar input,
.ed__toolbar select {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--ink);
  padding: 8px 0;
  border-radius: 0;
}
.ed__search input {
  inline-size: 100%;
  font: italic 400 24px var(--serif);
}
.ed__sorts,
.ed__filters {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  align-items: center;
  font: 13px var(--mono);
}
.ed__sorts span,
.ed__filters span {
  color: var(--muted);
}
.ed__sorts button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 2px 0;
  cursor: pointer;
}
.ed__sorts button[aria-pressed="true"] {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 4px;
}
.ed__toc {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ed__toc li {
  display: grid;
  grid-template-columns: 4.6rem 1fr 64px;
  gap: 16px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid color-mix(in oklab, var(--ink) 30%, transparent);
}
.ed__toc-num {
  font: 400 56px/1 var(--serif);
  font-variant-numeric: tabular-nums;
}
.ed__toc-body {
  display: grid;
  gap: 4px;
}
.ed__toc-name {
  color: inherit;
  text-decoration: none;
  font: 400 26px/1.1 var(--serif);
}
.ed__toc-name:hover {
  color: var(--accent);
}
.ed__toc-cover {
  inline-size: 64px;
  block-size: 64px;
  object-fit: cover;
}
.ed__pl {
  display: grid;
  gap: 32px;
}
@media (min-width: 900px) {
  .ed__pl {
    grid-template-columns: 340px 1fr;
  }
}
.ed__pl-side {
  display: grid;
  gap: 16px;
  align-content: start;
}
.ed__pl-cover {
  inline-size: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}
.ed__toolbar--inline {
  margin-block: 24px 8px;
}
.ed__tracks {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ed__tracks li {
  display: grid;
  grid-template-columns: 3ch 1fr auto;
  gap: 14px;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in oklab, var(--ink) 20%, transparent);
}
.ed__track-n {
  font: 13px var(--mono);
  color: var(--muted);
}
.ed__track-title {
  display: block;
  font: 400 21px/1.15 var(--serif);
}
.ed__track-sub {
  display: block;
  font-size: 14px;
  color: var(--muted);
}
.ed__e {
  display: inline-block;
  padding: 0 4px;
  border: 1px solid currentColor;
  font-size: 10px;
  line-height: 1.4;
}
.ed__pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  font: 400 26px var(--serif);
}
.ed__pager a {
  color: var(--accent);
  text-decoration: none;
}
.ed__pager [aria-disabled="true"] {
  color: var(--muted);
}
.ed__figures {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  margin: 0;
  border-block: 2px solid var(--ink);
}
.ed__figures div {
  padding: 16px 12px;
  border-inline-end: 1px solid color-mix(in oklab, var(--ink) 30%, transparent);
}
.ed__figures dt {
  font: 12px var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}
.ed__figures dd {
  margin: 4px 0 0;
  font: 400 64px/1 var(--serif);
}
.ed__cols {
  display: grid;
  gap: 32px;
}
@media (min-width: 900px) {
  .ed__cols {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .ed__cols--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.ed__h2 {
  margin: 0 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--ink);
  font: 400 italic 24px var(--serif);
}
.ed__quotes {
  display: grid;
  gap: 16px;
}
@media (min-width: 760px) {
  .ed__quotes {
    grid-template-columns: repeat(3, 1fr);
  }
}
.ed__quotes blockquote {
  margin: 0;
  padding-left: 14px;
  border-left: 3px solid var(--accent);
  font: italic 400 20px/1.3 var(--serif);
}
.ed__quotes span {
  display: block;
  font: normal 400 72px/1 var(--serif);
  color: var(--accent);
}
.ed__table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.ed__table th {
  text-align: left;
  font: 500 11px var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  padding: 6px 4px;
  border-bottom: 1px solid var(--ink);
}
.ed__table td {
  padding: 8px 4px;
  border-bottom: 1px solid color-mix(in oklab, var(--ink) 18%, transparent);
  font-variant-numeric: tabular-nums;
}
.ed__repeats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}
.sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
