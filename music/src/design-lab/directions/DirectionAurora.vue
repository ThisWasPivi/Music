<script setup lang="ts">
/**
 * DirectionAurora component
 * Direction B: dark glassmorphism. Frosted panels float over blurred blobs
 * painted with the colours extracted from the covers at sync time.
 */
import "@fontsource-variable/bricolage-grotesque";
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
import LogoPause from "../logos/LogoPause.vue";
import { useLabData } from "../useLabData.ts";

defineProps<{
  /** Colour scheme to render. */
  theme: "light" | "dark";

  /** Anchor prefix for the lab navigation. */
  prefix: string;
}>();

const data = useLabData();
const [first = "#7c3aed", second = "#22d3ee", third = "#f472b6"] =
  data.featured.palette;
const glow = computed(() => ({ "--c1": first, "--c2": second, "--c3": third }));
const SORTS = ["Numero", "Nome", "Brani", "Durata", "Aggiornata", "Colore"];
</script>

<template>
  <div class="au" :data-theme="theme" :style="glow">
    <LabScreen :id="`${prefix}-sistema`" label="Palette & tipografia">
      <div class="au__page">
        <div class="au__blobs" aria-hidden="true"><span /><span /><span /></div>
        <div class="au__grid2">
          <div class="au__glass au__pad">
            <p class="au__eyebrow">Colori dinamici</p>
            <p class="au__muted">
              Gli accenti cambiano con la cover della playlist aperta: la
              palette è estratta allo sync.
            </p>
            <div class="au__swatches">
              <span
                v-for="color in data.featured.palette"
                :key="color"
                :style="{ background: color }"
                >{{ color }}</span
              >
            </div>
            <p class="au__eyebrow">Base</p>
            <div class="au__swatches">
              <span style="background: var(--bg)">bg</span>
              <span style="background: var(--glass-solid)">vetro</span>
              <span style="background: var(--text); color: var(--bg)"
                >testo</span
              >
              <span style="background: var(--muted); color: var(--bg)"
                >muted</span
              >
            </div>
          </div>
          <div class="au__glass au__pad">
            <p class="au__eyebrow">Display — Bricolage Grotesque</p>
            <p class="au__display">Pivəəkly <span class="au__grad">24</span></p>
            <p class="au__eyebrow">Testo — Inter</p>
            <p>
              Una playlist ogni tanto, quando c'è abbastanza musica da dire.
            </p>
            <p class="au__muted au__num">28 brani · 1 h 52 min · 14 gen 2024</p>
          </div>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-home`" label="Home / showcase">
      <div class="au__page">
        <div class="au__blobs" aria-hidden="true"><span /><span /><span /></div>
        <header class="au__nav au__glass">
          <LogoPause class="au__logo" />
          <nav aria-label="Principale">
            <a href="#" aria-current="page">Playlist</a>
            <a href="#">Statistiche</a>
            <a href="#">Serie</a>
          </nav>
        </header>

        <section class="au__hero au__glass">
          <img
            :src="data.featured.coverUrl ?? ''"
            alt=""
            class="au__hero-cover"
          />
          <div class="au__hero-body">
            <p class="au__eyebrow">
              Nuova uscita · {{ formatDate(data.featured.firstAddedAt) }}
            </p>
            <h1 class="au__display">{{ data.featured.name }}</h1>
            <p class="au__muted">{{ data.featured.description }}</p>
            <div class="au__chips">
              <span class="au__chip">{{ data.featured.trackCount }} brani</span>
              <span class="au__chip">{{
                formatLongDuration(data.featured.durationMs)
              }}</span>
              <span
                v-for="tag in data.featured.tags"
                :key="tag"
                class="au__chip"
                >#{{ tag }}</span
              >
            </div>
            <a href="#" class="au__cta"><SpotifyMark /> Ascolta su Spotify</a>
          </div>
        </section>

        <div class="au__toolbar">
          <input
            class="au__input au__glass"
            type="search"
            placeholder="Cerca brani, artisti, numeri"
            aria-label="Cerca"
          />
          <div class="au__chips">
            <button
              v-for="(sort, index) in SORTS"
              :key="sort"
              type="button"
              class="au__chip au__chip--btn"
              :aria-pressed="index === 0"
            >
              {{ sort }}<span v-if="index === 0" aria-hidden="true"> ↓</span>
            </button>
          </div>
          <div class="au__chips">
            <select class="au__chip au__chip--btn" aria-label="Artista">
              <option>Artista</option>
            </select>
            <select class="au__chip au__chip--btn" aria-label="Decennio">
              <option>Decennio</option>
              <option v-for="decade in data.decades" :key="decade">
                {{ decade }}s
              </option>
            </select>
            <button
              v-for="tag in data.tags.slice(0, 4)"
              :key="tag"
              type="button"
              class="au__chip au__chip--btn"
            >
              #{{ tag }}
            </button>
          </div>
        </div>

        <ul class="au__cards">
          <li
            v-for="playlist in data.playlists.slice(1, 9)"
            :key="playlist.id"
            class="au__card au__glass"
            :style="{ '--card': playlist.palette[0] }"
          >
            <img :src="playlist.coverUrl ?? ''" alt="" />
            <div>
              <a href="#" class="au__card-title">{{ playlist.name }}</a>
              <p class="au__muted au__num">
                {{ playlist.trackCount }} brani ·
                {{ formatLongDuration(playlist.durationMs) }}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-playlist`" label="Pagina playlist">
      <div class="au__page au__page--pl">
        <img
          :src="data.featured.coverUrl ?? ''"
          alt=""
          class="au__backdrop"
          aria-hidden="true"
        />
        <section class="au__pl-head">
          <img
            :src="data.featured.coverUrl ?? ''"
            alt=""
            class="au__pl-cover"
          />
          <div>
            <p class="au__eyebrow">Pivəəkly · Nº {{ data.featured.number }}</p>
            <h1 class="au__display au__display--xl">
              {{ data.featured.name }}
            </h1>
            <p class="au__muted">{{ data.featured.description }}</p>
            <p class="au__muted au__num">
              {{ data.featured.trackCount }} brani ·
              {{ formatLongDuration(data.featured.durationMs) }} · uscita ≈
              {{ formatDate(data.featured.firstAddedAt) }}*
            </p>
            <a href="#" class="au__cta"><SpotifyMark /> Apri su Spotify</a>
          </div>
        </section>
        <div class="au__pl-body">
          <div class="au__glass au__pad au__tracks">
            <div class="au__toolbar au__toolbar--row">
              <input
                class="au__input"
                type="search"
                placeholder="Filtra"
                aria-label="Filtra i brani"
              />
              <select class="au__chip au__chip--btn" aria-label="Ordina">
                <option>Ordine playlist</option>
                <option>Titolo</option>
                <option>Artista</option>
                <option>Album</option>
                <option>Anno</option>
                <option>Durata</option>
                <option>Aggiunto il</option>
              </select>
            </div>
            <table>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Titolo</th>
                  <th scope="col">Album</th>
                  <th scope="col">Anno</th>
                  <th scope="col">Aggiunto</th>
                  <th scope="col"><span class="sr-only">Durata</span>⏱</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(track, index) in data.featured.tracks.slice(0, 10)"
                  :key="track.id"
                >
                  <td class="au__muted">{{ index + 1 }}</td>
                  <td>
                    <strong>{{ track.title }}</strong>
                    <span class="au__muted"
                      ><b v-if="track.explicit" class="au__e">E</b>
                      {{
                        track.artists.map((artist) => artist.name).join(", ")
                      }}</span
                    >
                  </td>
                  <td class="au__muted">{{ track.album.name }}</td>
                  <td class="au__muted">{{ track.releaseYear }}</td>
                  <td class="au__muted">{{ formatDate(track.addedAt) }}</td>
                  <td class="au__num">
                    {{ formatTrackDuration(track.durationMs) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <aside class="au__aside">
            <EmbedMock :playlist="data.featured" />
            <nav class="au__pager" aria-label="Serie">
              <a href="#" class="au__glass au__pad">
                <span class="au__muted">← Precedente</span
                ><strong>{{ data.previous?.name }}</strong>
              </a>
              <span class="au__glass au__pad au__disabled"
                ><span class="au__muted">Successivo →</span
                ><strong>In arrivo</strong></span
              >
            </nav>
            <p class="au__muted au__note">
              * Data di uscita approssimata al primo brano aggiunto.
            </p>
          </aside>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-stats`" label="Statistiche">
      <div class="au__page">
        <div class="au__blobs" aria-hidden="true"><span /><span /><span /></div>
        <h1 class="au__display">Statistiche</h1>
        <div class="au__kpis">
          <div class="au__glass au__pad">
            <p class="au__muted">Brani</p>
            <p class="au__kpi">{{ formatNumber(data.summary.trackCount) }}</p>
          </div>
          <div class="au__glass au__pad">
            <p class="au__muted">Ore di musica</p>
            <p class="au__kpi">
              {{ Math.round(data.summary.totalMs / 3_600_000) }}
            </p>
          </div>
          <div class="au__glass au__pad">
            <p class="au__muted">Artisti unici</p>
            <p class="au__kpi">{{ data.summary.uniqueArtistCount }}</p>
          </div>
          <div class="au__glass au__pad">
            <p class="au__muted">Durata media</p>
            <p class="au__kpi">
              {{ formatTrackDuration(data.summary.averageMs) }}
            </p>
          </div>
          <div class="au__glass au__pad">
            <p class="au__muted">Espliciti</p>
            <p class="au__kpi">
              {{ formatPercent(data.summary.explicitShare) }}
            </p>
          </div>
          <div class="au__glass au__pad">
            <p class="au__muted">Più lungo · più corto</p>
            <p class="au__num">
              {{ data.summary.longest?.title }}
              {{ formatTrackDuration(data.summary.longest?.durationMs ?? 0) }}
            </p>
            <p class="au__num">
              {{ data.summary.shortest?.title }}
              {{ formatTrackDuration(data.summary.shortest?.durationMs ?? 0) }}
            </p>
          </div>
        </div>
        <div class="au__grid2">
          <section class="au__glass au__pad">
            <h2 class="au__h2">Top artisti</h2>
            <div class="au__chips au__tabs">
              <span class="au__chip au__chip--on">per brani</span
              ><span class="au__chip">per minuti</span
              ><span class="au__chip">Globale ▾</span>
            </div>
            <BarRanking :rows="data.artistRows" />
          </section>
          <section class="au__glass au__pad">
            <h2 class="au__h2">Top album</h2>
            <BarRanking :rows="data.albumRows" />
          </section>
        </div>
        <section class="au__glass au__pad">
          <h2 class="au__h2">Attività</h2>
          <HeatmapCalendar :heatmap="data.heatmap" />
        </section>
        <div class="au__grid2">
          <section class="au__glass au__pad">
            <h2 class="au__h2">Decenni</h2>
            <ColumnChart
              :columns="data.decadeColumns"
              label="Distribuzione dei brani per decennio di uscita"
            />
          </section>
          <section class="au__glass au__pad">
            <h2 class="au__h2">Artisti in comune (Jaccard)</h2>
            <OverlapMatrix
              :matrix="data.overlap"
              :labels="data.overlapLabels"
            />
          </section>
        </div>
      </div>
    </LabScreen>

    <LabScreen :id="`${prefix}-serie`" label="Serie & timeline">
      <div class="au__page">
        <div class="au__blobs" aria-hidden="true"><span /><span /><span /></div>
        <h1 class="au__display">La serie</h1>
        <section class="au__glass au__pad">
          <h2 class="au__h2">Timeline delle uscite</h2>
          <ReleaseTimeline
            :releases="data.timeline.releases"
            :highlight="data.timeline.maxGap"
            colored
            :radius="9"
          />
          <div class="au__kpis au__kpis--3">
            <div>
              <p class="au__muted">Intervallo medio</p>
              <p class="au__kpi">
                {{ Math.round(data.timeline.averageGapDays ?? 0) }} gg
              </p>
            </div>
            <div>
              <p class="au__muted">Minimo</p>
              <p class="au__kpi">
                {{ Math.round(data.timeline.minGap?.gapDays ?? 0) }} gg
              </p>
            </div>
            <div>
              <p class="au__muted">Massimo</p>
              <p class="au__kpi">
                {{ Math.round(data.timeline.maxGap?.gapDays ?? 0) }} gg
              </p>
            </div>
          </div>
        </section>
        <section class="au__glass au__pad">
          <h2 class="au__h2">Scoperte per numero</h2>
          <ColumnChart
            :columns="data.discoveryColumns"
            label="Nuovi artisti per numero"
            :height="110"
          />
        </section>
        <div class="au__grid2">
          <section class="au__glass au__pad">
            <h2 class="au__h2">Artisti ricorrenti</h2>
            <ul class="au__list">
              <li v-for="row in data.recurring" :key="row.artist.id">
                <strong>{{ row.artist.name }}</strong>
                <span class="au__muted au__num"
                  >{{ row.issueCount }} numeri · {{ row.firstIssue }}→{{
                    row.lastIssue
                  }}
                  · streak {{ row.longestStreak }}</span
                >
              </li>
            </ul>
          </section>
          <section class="au__glass au__pad">
            <h2 class="au__h2">Brani ripetuti</h2>
            <ul class="au__list">
              <li v-for="row in data.repeated" :key="row.track.id">
                <strong>{{ row.track.title }}</strong>
                <span class="au__issues"
                  ><span
                    v-for="issue in row.issues"
                    :key="issue"
                    class="au__chip"
                    >{{ issue }}</span
                  ></span
                >
              </li>
            </ul>
          </section>
        </div>
      </div>
    </LabScreen>
  </div>
</template>

<style scoped>
.au {
  --bg: #07060c;
  --glass: rgb(255 255 255 / 0.06);
  --glass-solid: #1a1924;
  --glass-border: rgb(255 255 255 / 0.12);
  --text: #f4f3f8;
  --muted: #a9a7ba;
  --accent: var(--c2);
  --display: "Bricolage Grotesque Variable", system-ui, sans-serif;
  --sans: "Inter Variable", system-ui, sans-serif;
  --chart-ink: var(--text);
  --chart-muted: var(--muted);
  --chart-grid: rgb(255 255 255 / 0.18);
  --chart-accent: var(--c2);
  --chart-bg: transparent;
  --bar: linear-gradient(90deg, var(--c1), var(--c2));
  --bar-highlight: var(--c3);
  --bar-fill: var(--c2);
  --bar-track: rgb(255 255 255 / 0.08);
  --matrix-hi: var(--c2);
  --matrix-lo: rgb(255 255 255 / 0.3);
  --heat-0: rgb(255 255 255 / 0.06);
  --heat-1: color-mix(in oklab, var(--c2) 35%, transparent);
  --heat-2: color-mix(in oklab, var(--c2) 60%, transparent);
  --heat-3: color-mix(in oklab, var(--c2) 85%, transparent);
  --heat-4: var(--c2);
  --logo-accent: var(--c2);
  --focus: var(--c2);
}
.au[data-theme="light"] {
  --bg: #eceef5;
  --glass: rgb(255 255 255 / 0.55);
  --glass-solid: #ffffff;
  --glass-border: rgb(255 255 255 / 0.9);
  --text: #12121a;
  --muted: #55536a;
  --chart-grid: rgb(0 0 0 / 0.15);
  --bar-track: rgb(0 0 0 / 0.07);
  --matrix-lo: rgb(0 0 0 / 0.25);
  --heat-0: rgb(0 0 0 / 0.06);
  --logo-accent: color-mix(in oklab, var(--c1) 80%, #000);
}
.au__page > * {
  min-width: 0;
}
.au__page {
  grid-template-columns: minmax(0, 1fr);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font: 15px/1.5 var(--sans);
  padding: clamp(16px, 3vw, 40px);
  display: grid;
  gap: 20px;
}
.au__blobs span {
  position: absolute;
  z-index: -1;
  inline-size: 50vmax;
  aspect-ratio: 1;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.55;
}
.au__blobs span:nth-child(1) {
  background: var(--c1);
  inset: -20% auto auto -10%;
}
.au__blobs span:nth-child(2) {
  background: var(--c2);
  inset: 30% -15% auto auto;
}
.au__blobs span:nth-child(3) {
  background: var(--c3);
  inset: auto auto -25% 20%;
  opacity: 0.35;
}
.au__glass {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: 22px;
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
}
.au__pad {
  padding: 20px;
}
.au__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}
.au[data-theme="light"] .au__eyebrow {
  color: color-mix(in oklab, var(--c1) 75%, #000);
}
.au__muted {
  color: var(--muted);
  margin: 0;
}
.au__num {
  font-variant-numeric: tabular-nums;
}
.au__display {
  margin: 0;
  font: 700 clamp(34px, 5vw, 64px) / 1 var(--display);
  letter-spacing: -0.03em;
}
.au__display--xl {
  font-size: clamp(40px, 7vw, 88px);
}
.au__grad {
  background: linear-gradient(90deg, var(--c1), var(--c2), var(--c3));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.au__grid2 {
  display: grid;
  gap: 20px;
}
@media (min-width: 860px) {
  .au__grid2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.au__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-block: 10px 18px;
}
.au__swatches span {
  display: grid;
  place-items: end start;
  inline-size: 84px;
  block-size: 64px;
  padding: 6px;
  border-radius: 14px;
  font-size: 11px;
  color: #fff;
  border: 1px solid var(--glass-border);
}
.au__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 18px;
  border-radius: 999px;
}
.au__logo {
  block-size: 28px;
  color: var(--text);
}
.au__nav nav {
  display: flex;
  gap: 4px;
}
.au__nav a {
  color: var(--muted);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 500;
}
.au__nav a[aria-current="page"] {
  color: var(--text);
  background: var(--glass);
}
.au__hero {
  display: grid;
  gap: 24px;
  padding: 20px;
}
@media (min-width: 760px) {
  .au__hero {
    grid-template-columns: 300px 1fr;
    align-items: center;
  }
}
.au__hero-cover {
  inline-size: 100%;
  aspect-ratio: 1;
  border-radius: 18px;
  object-fit: cover;
  box-shadow: 0 30px 80px -20px var(--c1);
}
.au__hero-body {
  display: grid;
  gap: 12px;
  justify-items: start;
}
.au__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.au__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--text);
  font: 500 13px var(--sans);
}
.au__chip--btn {
  cursor: pointer;
}
.au__chip--btn[aria-pressed="true"],
.au__chip--on {
  background: var(--text);
  color: var(--bg);
}
.au__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  background: #1ed760;
  color: #000;
  font-weight: 700;
  text-decoration: none;
}
.au__toolbar {
  display: grid;
  gap: 10px;
}
.au__toolbar--row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.au__input {
  font: inherit;
  color: inherit;
  padding: 12px 18px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  flex: 1;
}
.au__cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}
.au__card {
  padding: 12px;
  display: grid;
  gap: 10px;
  transition:
    transform 200ms,
    box-shadow 200ms;
}
.au__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 50px -18px var(--card);
}
.au__card img {
  inline-size: 100%;
  aspect-ratio: 1;
  border-radius: 14px;
  object-fit: cover;
  box-shadow: 0 16px 40px -16px var(--card);
}
.au__card-title {
  color: var(--text);
  text-decoration: none;
  font: 600 17px var(--display);
}
.au__page--pl {
  min-height: 600px;
}
.au__backdrop {
  position: absolute;
  inset: -10%;
  z-index: -1;
  inline-size: 120%;
  max-inline-size: none;
  block-size: 70%;
  object-fit: cover;
  filter: blur(70px) saturate(1.4);
  opacity: 0.75;
  mask-image: linear-gradient(#000 40%, transparent);
}
.au__pl-head {
  display: grid;
  gap: 24px;
  align-items: end;
}
@media (min-width: 760px) {
  .au__pl-head {
    grid-template-columns: 240px 1fr;
  }
}
.au__pl-cover {
  inline-size: 100%;
  max-inline-size: 240px;
  aspect-ratio: 1;
  border-radius: 18px;
  box-shadow: 0 30px 60px -20px rgb(0 0 0 / 0.6);
}
.au__pl-head .au__cta {
  margin-top: 12px;
}
.au__pl-body {
  display: grid;
  gap: 20px;
}
@media (min-width: 1000px) {
  .au__pl-body {
    grid-template-columns: 1fr 320px;
    align-items: start;
  }
}
.au__tracks {
  overflow-x: auto;
}
.au__tracks table {
  inline-size: 100%;
  border-collapse: collapse;
  min-inline-size: 560px;
}
.au__tracks th {
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  padding: 6px 8px;
  border-bottom: 1px solid var(--glass-border);
}
.au__tracks td {
  padding: 8px;
  vertical-align: top;
}
.au__tracks tbody tr:hover {
  background: var(--glass);
}
.au__tracks td strong,
.au__tracks td span {
  display: block;
}
.au__e {
  display: inline-block;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--muted);
  color: var(--bg);
  font-size: 10px;
}
.au__aside {
  display: grid;
  gap: 14px;
  --embed-radius: 22px;
}
.au__pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.au__pager > * {
  display: grid;
  gap: 2px;
  color: var(--text);
  text-decoration: none;
  font-size: 13px;
}
.au__disabled {
  opacity: 0.55;
}
.au__note {
  font-size: 12px;
}
.au__kpis {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}
.au__kpis--3 {
  margin-top: 16px;
}
.au__kpis p {
  margin: 0;
}
.au__kpi {
  font: 700 40px/1.1 var(--display);
  background: linear-gradient(90deg, var(--text), var(--c2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.au__h2 {
  margin: 0 0 14px;
  font: 600 20px var(--display);
}
.au__tabs {
  margin-bottom: 14px;
}
.au__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
.au__list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.au__issues {
  display: flex;
  gap: 4px;
}
.sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
