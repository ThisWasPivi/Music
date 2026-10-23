<script setup lang="ts">
/**
 * DirectionVinyl component
 * Direction D: seventies record shop. Warm cream and brown, sunburst
 * stripes, playlists as record sleeves with the disc sliding out, and the
 * tracklist split into side A and side B.
 */
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";

import { computed } from "vue";

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
import LogoVinyl from "../logos/LogoVinyl.vue";
import { useLabData } from "../useLabData.ts";

defineProps<{
  /** Colour scheme to render. */
  theme: "light" | "dark";

  /** Anchor prefix for the lab navigation. */
  prefix: string;
}>();

const data = useLabData();
const sides = computed(() => {
  const tracks = data.featured.tracks.slice(0, 12);
  const half = Math.ceil(tracks.length / 2);
  return [
    { name: "Lato A", tracks: tracks.slice(0, half), offset: 0 },
    { name: "Lato B", tracks: tracks.slice(half), offset: half },
  ];
});
const SWATCHES = [
  { name: "Crema", token: "--cream" },
  { name: "Tabacco", token: "--brown" },
  { name: "Arancio", token: "--orange" },
  { name: "Senape", token: "--mustard" },
  { name: "Petrolio", token: "--teal" },
];
</script>

<template>
  <div class="vy" :data-theme="theme">
    <LabScreen :id="`${prefix}-sistema`" label="Palette & tipografia">
      <div class="vy__page vy__system">
        <div class="vy__stripes" aria-hidden="true" />
        <div class="vy__swatches">
          <div v-for="swatch in SWATCHES" :key="swatch.token">
            <span :style="{ background: `var(${swatch.token})` }" />
            <strong>{{ swatch.name }}</strong>
          </div>
        </div>
        <div>
          <p class="vy__label">Display — Fraunces (soft, 900)</p>
          <p class="vy__display">Pivəəkly <em>Nº 24</em></p>
          <p class="vy__label">Testo — Inter</p>
          <p>Una playlist ogni tanto, quando c'è abbastanza musica da dire.</p>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-home`" label="Home / showcase">
      <div class="vy__page">
        <header class="vy__head">
          <LogoVinyl class="vy__logo" variant="wordmark" />
          <nav aria-label="Principale">
            <a href="#" aria-current="page">Dischi</a>
            <a href="#">Classifiche</a>
            <a href="#">Serie</a>
          </nav>
        </header>
        <section class="vy__hero">
          <div class="vy__stripes" aria-hidden="true" />
          <div class="vy__hero-text">
            <p class="vy__label">
              Fresco di stampa · {{ formatDate(data.featured.firstAddedAt) }}
            </p>
            <h1 class="vy__display vy__display--xl">
              Pivəəkly<br /><em>Nº {{ data.featured.number }}</em>
            </h1>
            <p>{{ data.featured.description }}</p>
            <a href="#" class="vy__btn"><SpotifyMark /> Ascolta su Spotify</a>
          </div>
          <div
            class="vy__sleeve vy__sleeve--big"
            :style="{ '--label': data.featured.palette[1] }"
          >
            <span class="vy__disc" aria-hidden="true" />
            <img :src="data.featured.coverUrl ?? ''" alt="" />
          </div>
        </section>
        <div class="vy__toolbar">
          <input
            type="search"
            placeholder="Cerca nel negozio…"
            aria-label="Cerca"
          />
          <select aria-label="Ordina">
            <option>Numero, dal più recente</option>
            <option>Nome</option>
            <option>Numero brani</option>
            <option>Durata</option>
            <option>Ultimo aggiornamento</option>
            <option>Colore della busta</option>
          </select>
          <select aria-label="Artista">
            <option>Ogni artista</option>
          </select>
          <select aria-label="Decennio">
            <option>Ogni decennio</option>
            <option v-for="decade in data.decades" :key="decade">
              Anni {{ String(decade).slice(2) }}
            </option>
          </select>
          <div class="vy__tags">
            <button
              v-for="(tag, index) in data.tags.slice(0, 5)"
              :key="tag"
              type="button"
              :aria-pressed="index === 1"
            >
              {{ tag }}
            </button>
          </div>
        </div>
        <ul class="vy__crate">
          <li v-for="playlist in data.playlists.slice(1, 9)" :key="playlist.id">
            <a
              href="#"
              class="vy__sleeve"
              :style="{ '--label': playlist.palette[1] }"
            >
              <span class="vy__disc" aria-hidden="true" />
              <img :src="playlist.coverUrl ?? ''" alt="" />
            </a>
            <p class="vy__crate-name">{{ playlist.name }}</p>
            <p class="vy__small">
              {{ playlist.trackCount }} brani ·
              {{ formatLongDuration(playlist.durationMs) }}
            </p>
          </li>
        </ul>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-playlist`" label="Pagina playlist">
      <div class="vy__page">
        <div class="vy__pl">
          <div class="vy__pl-art">
            <div
              class="vy__sleeve vy__sleeve--big vy__sleeve--out"
              :style="{ '--label': data.featured.palette[1] }"
            >
              <span class="vy__disc vy__disc--spin" aria-hidden="true" />
              <img :src="data.featured.coverUrl ?? ''" alt="" />
            </div>
            <EmbedMock :playlist="data.featured" />
          </div>
          <div>
            <p class="vy__label">
              Pivəəkly · Nº {{ data.featured.number }} · stampato il ≈
              {{ formatDate(data.featured.firstAddedAt) }}
            </p>
            <h1 class="vy__display vy__display--xl">
              {{ data.featured.name }}
            </h1>
            <p>{{ data.featured.description }}</p>
            <p class="vy__meta">
              <span>{{ data.featured.trackCount }} brani</span
              ><span>{{ formatLongDuration(data.featured.durationMs) }}</span>
              <span>agg. {{ formatDate(data.featured.lastAddedAt) }}</span>
            </p>
            <div class="vy__toolbar vy__toolbar--compact">
              <input
                type="search"
                placeholder="Filtra i brani…"
                aria-label="Filtra i brani"
              />
              <select aria-label="Ordina i brani">
                <option>Ordine del disco</option>
                <option>Titolo</option>
                <option>Artista</option>
                <option>Album</option>
                <option>Anno</option>
                <option>Durata</option>
                <option>Aggiunto il</option>
              </select>
              <a href="#" class="vy__btn vy__btn--ghost"
                ><SpotifyMark /> Spotify</a
              >
            </div>
            <div class="vy__sides">
              <section v-for="side in sides" :key="side.name">
                <h2 class="vy__side">{{ side.name }}</h2>
                <ol>
                  <li v-for="(track, index) in side.tracks" :key="track.id">
                    <span class="vy__n">{{ side.offset + index + 1 }}</span>
                    <span>
                      <strong>{{ track.title }}</strong>
                      <span class="vy__small"
                        >{{
                          track.artists.map((artist) => artist.name).join(", ")
                        }}
                        · {{ track.releaseYear }}</span
                      >
                    </span>
                    <span class="vy__small">{{
                      formatTrackDuration(track.durationMs)
                    }}</span>
                  </li>
                </ol>
              </section>
            </div>
            <nav class="vy__pager" aria-label="Serie">
              <a href="#">◂ Nº {{ data.previous?.number }}</a>
              <span
                >Nº {{ (data.featured.number ?? 0) + 1 }} non ancora
                stampato</span
              >
            </nav>
          </div>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-stats`" label="Statistiche">
      <div class="vy__page">
        <h1 class="vy__display">Le classifiche</h1>
        <div class="vy__badges">
          <div>
            <strong>{{ formatNumber(data.summary.trackCount) }}</strong
            ><span>brani</span>
          </div>
          <div>
            <strong>{{ data.summary.uniqueArtistCount }}</strong
            ><span>artisti</span>
          </div>
          <div>
            <strong>{{ formatTrackDuration(data.summary.averageMs) }}</strong
            ><span>durata media</span>
          </div>
          <div>
            <strong>{{ formatPercent(data.summary.explicitShare) }}</strong
            ><span>espliciti</span>
          </div>
          <div>
            <strong>{{
              formatTrackDuration(data.summary.longest?.durationMs ?? 0)
            }}</strong
            ><span>il più lungo</span>
          </div>
          <div>
            <strong>{{
              formatTrackDuration(data.summary.shortest?.durationMs ?? 0)
            }}</strong
            ><span>il più corto</span>
          </div>
        </div>
        <div class="vy__cols">
          <section class="vy__card">
            <h2 class="vy__h2">Hit parade · artisti</h2>
            <BarRanking :rows="data.artistRows" />
          </section>
          <section class="vy__card">
            <h2 class="vy__h2">Per minuti</h2>
            <BarRanking :rows="data.artistMinuteRows" />
          </section>
          <section class="vy__card">
            <h2 class="vy__h2">Album</h2>
            <BarRanking :rows="data.albumRows" />
          </section>
        </div>
        <section class="vy__card">
          <h2 class="vy__h2">Diario delle aggiunte</h2>
          <HeatmapCalendar :heatmap="data.heatmap" />
        </section>
        <div class="vy__cols vy__cols--2">
          <section class="vy__card">
            <h2 class="vy__h2">Annate</h2>
            <ColumnChart
              :columns="data.decadeColumns"
              label="Brani per decennio di uscita"
            />
          </section>
          <section class="vy__card">
            <h2 class="vy__h2">Dischi gemelli (Jaccard)</h2>
            <OverlapMatrix
              :matrix="data.overlap"
              :labels="data.overlapLabels"
            />
          </section>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-serie`" label="Serie & timeline">
      <div class="vy__page">
        <h1 class="vy__display">La discografia</h1>
        <section class="vy__card">
          <h2 class="vy__h2">Le uscite, sul calendario vero</h2>
          <ReleaseTimeline
            :releases="data.timeline.releases"
            :highlight="data.timeline.maxGap"
            :radius="9"
          />
          <div class="vy__badges vy__badges--3">
            <div>
              <strong>{{
                Math.round(data.timeline.averageGapDays ?? 0)
              }}</strong
              ><span>giorni in media</span>
            </div>
            <div>
              <strong>{{
                Math.round(data.timeline.minGap?.gapDays ?? 0)
              }}</strong
              ><span
                >minimo (→ Nº {{ data.timeline.minGap?.playlist.number }})</span
              >
            </div>
            <div>
              <strong>{{
                Math.round(data.timeline.maxGap?.gapDays ?? 0)
              }}</strong
              ><span
                >massimo (→ Nº
                {{ data.timeline.maxGap?.playlist.number }})</span
              >
            </div>
          </div>
        </section>
        <section class="vy__card">
          <h2 class="vy__h2">Nuove voci per numero</h2>
          <ColumnChart
            :columns="data.discoveryColumns"
            label="Nuovi artisti per numero"
            :height="110"
          />
        </section>
        <div class="vy__cols vy__cols--2">
          <section class="vy__card">
            <h2 class="vy__h2">Ospiti fissi</h2>
            <ul class="vy__list">
              <li v-for="row in data.recurring" :key="row.artist.id">
                <strong>{{ row.artist.name }}</strong>
                <span class="vy__small"
                  >{{ row.issueCount }} numeri · dal {{ row.firstIssue }} al
                  {{ row.lastIssue }} · {{ row.longestStreak }} di fila</span
                >
              </li>
            </ul>
          </section>
          <section class="vy__card">
            <h2 class="vy__h2">Ristampe</h2>
            <ul class="vy__list">
              <li v-for="row in data.repeated" :key="row.track.id">
                <strong>{{ row.track.title }}</strong>
                <span class="vy__small">Nº {{ row.issues.join(" · ") }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </LabScreen>
  </div>
</template>

<style scoped>
.vy {
  --cream: #f2e4c9;
  --paper: #f7ecd6;
  --brown: #3a2417;
  --orange: #d9622b;
  --mustard: #e3a835;
  --teal: #2e6b66;
  --bg: var(--cream);
  --text: var(--brown);
  --muted: #7a5b45;
  --card: var(--paper);
  --serif: "Fraunces Variable", Georgia, serif;
  --sans: "Inter Variable", system-ui, sans-serif;
  --chart-ink: var(--brown);
  --chart-muted: var(--muted);
  --chart-grid: color-mix(in oklab, var(--brown) 30%, transparent);
  --chart-accent: var(--orange);
  --chart-bg: var(--card);
  --bar: var(--orange);
  --bar-highlight: var(--teal);
  --bar-track: color-mix(in oklab, var(--mustard) 25%, transparent);
  --bar-size: 8px;
  --matrix-hi: var(--teal);
  --matrix-lo: var(--mustard);
  --heat-0: color-mix(in oklab, var(--brown) 8%, var(--card));
  --heat-1: color-mix(in oklab, var(--mustard) 60%, var(--card));
  --heat-2: var(--mustard);
  --heat-3: var(--orange);
  --heat-4: #a33d16;
  --logo-accent: var(--orange);
  --logo-bg: var(--cream);
  --logo-groove: var(--cream);
  --focus: var(--teal);
}
.vy[data-theme="dark"] {
  --bg: #1d130d;
  --text: #f2e4c9;
  --muted: #c4a98c;
  --card: #2a1c13;
  --orange: #ee7a3e;
  --teal: #5fb3ab;
  --logo-bg: #1d130d;
  --logo-groove: #1d130d;
  --heat-4: #ffb07a;
}
.vy__page {
  position: relative;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font: 15px/1.55 var(--sans);
  padding: clamp(18px, 4vw, 48px);
  display: grid;
  gap: 24px;
}
.vy__page > * {
  min-width: 0;
  position: relative;
  z-index: 1;
}
.vy__page > .vy__stripes {
  position: absolute;
  z-index: 0;
}
.vy__stripes {
  position: absolute;
  inset: auto -10% -30% auto;
  inline-size: 520px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    transparent 0 30%,
    var(--teal) 30% 40%,
    var(--mustard) 40% 50%,
    var(--orange) 50% 60%,
    #a33d16 60% 70%,
    transparent 70%
  );
  opacity: 0.85;
  pointer-events: none;
}
@media (max-width: 759px) {
  .vy__system > .vy__stripes {
    display: none;
  }
}
.vy__system {
  grid-template-columns: 1fr;
  min-block-size: 280px;
}
@media (min-width: 760px) {
  .vy__system {
    grid-template-columns: 1fr 2fr;
    padding-right: 300px;
  }
}
.vy__swatches {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  align-self: start;
}
.vy__swatches div {
  display: grid;
  gap: 4px;
  font-size: 12px;
}
.vy__swatches span {
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3px solid var(--brown);
}
.vy__label {
  margin: 0;
  font: 600 12px var(--sans);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--orange);
}
.vy__display {
  position: relative;
  margin: 0;
  font: 900 clamp(40px, 6vw, 72px) / 0.95 var(--serif);
  font-variation-settings:
    "SOFT" 100,
    "WONK" 1;
  letter-spacing: -0.02em;
}
.vy__display em {
  color: var(--orange);
  font-style: italic;
}
.vy__display--xl {
  font-size: clamp(52px, 9vw, 120px);
}
.vy__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.vy__logo {
  block-size: 38px;
  color: var(--text);
}
.vy__head nav {
  display: flex;
  gap: 6px;
}
.vy__head a {
  padding: 6px 14px;
  border-radius: 999px;
  border: 2px solid var(--text);
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}
.vy__head a[aria-current="page"] {
  background: var(--text);
  color: var(--bg);
}
.vy__hero {
  position: relative;
  display: grid;
  gap: 24px;
  align-items: center;
  padding: clamp(18px, 3vw, 36px);
  border-radius: 28px;
  background: var(--card);
  overflow: hidden;
}
@media (min-width: 860px) {
  .vy__hero {
    grid-template-columns: 1fr 1fr;
  }
}
.vy__hero-text {
  position: relative;
  display: grid;
  gap: 14px;
  justify-items: start;
}
.vy__hero-text p {
  margin: 0;
  max-inline-size: 44ch;
}
.vy__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 999px;
  background: var(--orange);
  color: #fff8ec;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 0 #a33d16;
}
.vy__btn--ghost {
  background: transparent;
  color: var(--text);
  border: 2px solid var(--text);
  box-shadow: none;
  padding: 6px 14px;
}
.vy__sleeve {
  position: relative;
  display: block;
  inline-size: 100%;
  aspect-ratio: 1;
  max-inline-size: 85%;
}
.vy__sleeve img {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  border-radius: 4px;
  box-shadow:
    0 2px 0 rgb(0 0 0 / 0.15),
    6px 10px 24px rgb(58 36 23 / 0.35);
}
.vy__sleeve--big {
  max-inline-size: 360px;
  justify-self: center;
}
.vy__disc {
  position: absolute;
  inset: 3%;
  border-radius: 50%;
  background:
    radial-gradient(circle, #f2e4c9 0 3%, var(--label) 3% 30%, transparent 30%),
    repeating-radial-gradient(circle, #111 0 2px, #1e1e1e 2px 4px);
  transition: transform 450ms cubic-bezier(0.3, 0.7, 0.2, 1);
}
.vy__sleeve:hover .vy__disc,
.vy__sleeve:focus-visible .vy__disc,
.vy__sleeve--big .vy__disc {
  transform: translateX(36%);
}
.vy__sleeve--out .vy__disc {
  transform: translateX(42%);
}
.vy__disc--spin {
  animation: vy-spin 6s linear infinite;
}
@keyframes vy-spin {
  from {
    transform: translateX(42%) rotate(0);
  }
  to {
    transform: translateX(42%) rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .vy__disc--spin {
    animation: none;
  }
}
.vy__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.vy__toolbar input,
.vy__toolbar select {
  font: inherit;
  color: inherit;
  background: var(--card);
  border: 2px solid var(--text);
  border-radius: 999px;
  padding: 8px 16px;
}
.vy__toolbar input {
  flex: 1 1 220px;
}
.vy__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.vy__tags button {
  font: 600 13px var(--sans);
  padding: 4px 12px;
  border-radius: 999px;
  border: 0;
  background: color-mix(in oklab, var(--mustard) 45%, transparent);
  color: var(--text);
  cursor: pointer;
}
.vy__tags button[aria-pressed="true"] {
  background: var(--teal);
  color: #fff8ec;
}
.vy__crate {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 28px 32px;
}
.vy__crate-name {
  margin: 12px 0 0;
  font: 800 19px/1.1 var(--serif);
}
.vy__small {
  margin: 0;
  display: block;
  font-size: 13px;
  color: var(--muted);
}
.vy__pl {
  display: grid;
  gap: 40px;
}
@media (min-width: 960px) {
  .vy__pl {
    grid-template-columns: 380px 1fr;
  }
}
.vy__pl-art {
  display: grid;
  gap: 24px;
  align-content: start;
  padding-right: 80px;
  --embed-radius: 16px;
}
.vy__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.vy__meta span {
  padding: 2px 10px;
  border-radius: 999px;
  border: 1.5px solid var(--text);
  font-size: 13px;
}
.vy__toolbar--compact {
  margin-block: 16px;
}
.vy__sides {
  display: grid;
  gap: 18px;
}
@media (min-width: 720px) {
  .vy__sides {
    grid-template-columns: 1fr 1fr;
  }
}
.vy__sides section {
  background: var(--card);
  border-radius: 20px;
  padding: 16px;
}
.vy__side {
  margin: 0 0 10px;
  display: inline-block;
  padding: 2px 12px;
  border-radius: 999px;
  background: var(--brown);
  color: var(--cream);
  font: 800 15px var(--serif);
}
.vy[data-theme="dark"] .vy__side {
  background: var(--orange);
  color: var(--bg);
}
.vy__sides ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
.vy__sides li {
  display: grid;
  grid-template-columns: 1.6em 1fr auto;
  gap: 8px;
  align-items: baseline;
}
.vy__n {
  font: 800 15px var(--serif);
  color: var(--orange);
}
.vy__pager {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  font: 800 18px var(--serif);
}
.vy__pager a {
  color: var(--orange);
  text-decoration: none;
}
.vy__pager span {
  color: var(--muted);
  font-size: 14px;
}
.vy__badges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 14px;
}
.vy__badges--3 {
  margin-top: 16px;
}
.vy__badges div {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  max-inline-size: 170px;
  border-radius: 50%;
  background: var(--brown);
  color: var(--cream);
  text-align: center;
  box-shadow:
    inset 0 0 0 8px #241510,
    inset 0 0 0 10px var(--mustard);
  padding: 18px;
}
.vy[data-theme="dark"] .vy__badges div {
  background: #0f0906;
}
.vy__badges strong {
  font: 900 30px/1 var(--serif);
  color: var(--mustard);
}
.vy__badges span {
  font-size: 12px;
}
.vy__cols {
  display: grid;
  gap: 20px;
}
@media (min-width: 900px) {
  .vy__cols {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .vy__cols--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.vy__card {
  background: var(--card);
  border-radius: 24px;
  padding: 20px;
}
.vy__h2 {
  margin: 0 0 14px;
  font: 800 22px var(--serif);
}
.vy__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
</style>
