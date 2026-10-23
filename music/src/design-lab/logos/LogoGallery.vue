<script setup lang="ts">
/**
 * LogoGallery component
 * The three "pivi" logo concepts, in light and dark, with favicon previews
 * and links to the standalone SVG files.
 */
import LogoBars from "./LogoBars.vue";
import LogoPause from "./LogoPause.vue";
import LogoVinyl from "./LogoVinyl.vue";

defineProps<{
  /** Colour scheme of the surrounding lab (each concept shows both anyway). */
  theme: "light" | "dark";

  /** Anchor prefix for the lab navigation. */
  prefix: string;
}>();

const BASE = import.meta.env.BASE_URL;
const CONCEPTS = [
  {
    id: "bars",
    name: "1 · Barre | ▷ |",
    text: "“i v i” letto come un player: le i senza puntino sono barre, la v ruotata è il tasto play. La p resta tipografica.",
    files: ["logo-bars-light.svg", "logo-bars-dark.svg"],
  },
  {
    id: "pause",
    name: "2 · Pausa → Play",
    text: "Le due i accostate formano la pausa ⏸. Al passaggio del mouse (o al focus) le barre si fondono nel triangolo play. Rispetta prefers-reduced-motion.",
    files: ["logo-pause-light.svg", "logo-pause-dark.svg"],
  },
  {
    id: "vinyl",
    name: "3 · p vinile",
    text: "L'occhiello della p è un disco con etichetta, l'asta è il braccio del giradischi. Nato per la favicon; in versione estesa si combina con | ▷ |. Il disco gira all'hover.",
    files: [
      "logo-vinyl-light.svg",
      "logo-vinyl-dark.svg",
      "mark-vinyl-light.svg",
      "mark-vinyl-dark.svg",
    ],
  },
] as const;
</script>

<template>
  <div class="logos">
    <article
      v-for="concept in CONCEPTS"
      :key="concept.id"
      class="logos__concept"
    >
      <header>
        <h2>{{ concept.name }}</h2>
        <p>{{ concept.text }}</p>
      </header>
      <div class="logos__tiles">
        <div
          v-for="tone in ['light', 'dark']"
          :key="tone"
          class="logos__tile"
          :data-tone="tone"
        >
          <LogoBars v-if="concept.id === 'bars'" class="logos__big" />
          <LogoPause v-else-if="concept.id === 'pause'" class="logos__big" />
          <div v-else class="logos__pair">
            <LogoVinyl class="logos__big" variant="wordmark" />
            <LogoVinyl class="logos__mark" />
          </div>
          <span class="logos__tone">{{
            tone === "light" ? "Chiaro" : "Scuro"
          }}</span>
        </div>
      </div>
      <div class="logos__sizes" aria-label="Scale ridotte">
        <template v-for="size in [64, 32, 20]" :key="size">
          <LogoBars
            v-if="concept.id === 'bars'"
            :style="{ blockSize: `${size}px` }"
          />
          <LogoPause
            v-else-if="concept.id === 'pause'"
            :style="{ blockSize: `${size}px` }"
          />
          <LogoVinyl
            v-else
            variant="wordmark"
            :style="{ blockSize: `${size}px` }"
          />
        </template>
      </div>
      <p class="logos__files">
        SVG:
        <a
          v-for="file in concept.files"
          :key="file"
          :href="`${BASE}brand/${file}`"
          target="_blank"
          rel="noopener"
          >{{ file }}</a
        >
      </p>
    </article>

    <article class="logos__concept">
      <header>
        <h2>Favicon</h2>
        <p>
          Dal concept 3: la p vinile su tessera scura, leggibile sia con schede
          chiare sia scure. 64, 32 e 16 px.
        </p>
      </header>
      <div class="logos__favs">
        <div
          v-for="tone in ['light', 'dark']"
          :key="tone"
          class="logos__tab"
          :data-tone="tone"
        >
          <img
            :src="`${BASE}brand/favicon-vinyl.svg`"
            alt="Favicon 64 px"
            width="64"
            height="64"
          />
          <img
            :src="`${BASE}brand/favicon-vinyl.svg`"
            alt="Favicon 32 px"
            width="32"
            height="32"
          />
          <span class="logos__fake-tab">
            <img
              :src="`${BASE}brand/favicon-vinyl.svg`"
              alt="Favicon 16 px"
              width="16"
              height="16"
            />
            Pivəəkly · music.pivi.dev
          </span>
        </div>
      </div>
      <p class="logos__files">
        SVG:
        <a
          :href="`${BASE}brand/favicon-vinyl.svg`"
          target="_blank"
          rel="noopener"
          >favicon-vinyl.svg</a
        >
      </p>
    </article>
  </div>
</template>

<style scoped>
.logos {
  display: grid;
  gap: 28px;
  max-inline-size: 1100px;
  margin-inline: auto;
}
.logos__concept {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  display: grid;
  gap: 16px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.08);
}
.logos__concept h2 {
  margin: 0;
  font-size: 18px;
}
.logos__concept header p {
  margin: 4px 0 0;
  color: #55555f;
  max-inline-size: 70ch;
}
.logos__tiles,
.logos__favs {
  display: grid;
  gap: 12px;
}
@media (min-width: 700px) {
  .logos__tiles,
  .logos__favs {
    grid-template-columns: 1fr 1fr;
  }
}
.logos__tile,
.logos__tab {
  position: relative;
  display: grid;
  place-items: center;
  min-block-size: 200px;
  border-radius: 12px;
}
[data-tone="light"] {
  background: #fffdf8;
  color: #121212;
  --logo-accent: #ff4f2e;
  --logo-bg: #fffdf8;
  --logo-groove: #ffffff;
  border: 1px solid #e6e2d8;
}
[data-tone="dark"] {
  background: #121212;
  color: #f6f3ec;
  --logo-accent: #ff6b4a;
  --logo-bg: #121212;
  --logo-groove: #121212;
}
.logos__big {
  block-size: 96px;
}
.logos__pair {
  display: flex;
  align-items: center;
  gap: 32px;
}
.logos__mark {
  block-size: 80px;
}
.logos__tone {
  position: absolute;
  inset: 10px auto auto 12px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.6;
}
.logos__sizes {
  display: flex;
  align-items: end;
  gap: 28px;
  padding: 12px;
  color: #121212;
  --logo-accent: #ff4f2e;
  --logo-bg: #fff;
}
.logos__files {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 13px;
  color: #55555f;
}
.logos__files a {
  color: #2a52be;
}
.logos__tab {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
}
.logos__fake-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px 8px 0 0;
  font-size: 12px;
  background: color-mix(in oklab, currentColor 10%, transparent);
}
</style>
