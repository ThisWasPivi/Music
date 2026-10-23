<script setup lang="ts">
/**
 * DesignLabView component
 * Gallery to compare the four design directions and the logo concepts on
 * the sample data. Temporary: removed once a direction is chosen.
 */
import { type Component, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import DirectionAurora from "./directions/DirectionAurora.vue";
import DirectionEditorial from "./directions/DirectionEditorial.vue";
import DirectionIndex from "./directions/DirectionIndex.vue";
import DirectionVinyl from "./directions/DirectionVinyl.vue";
import LogoGallery from "./logos/LogoGallery.vue";

/**
 * One gallery tab.
 * @property id - Query-string value
 * @property label - Tab label
 * @property blurb - One-line description
 * @property component - What the tab renders
 */
interface LabTab {
  id: string;
  label: string;
  blurb: string;
  component: Component;
}

const TABS: readonly LabTab[] = [
  {
    id: "editoriale",
    label: "A · Editoriale",
    blurb: "Fanzine tipografica: carta, inchiostro, numeri giganti.",
    component: DirectionEditorial,
  },
  {
    id: "aurora",
    label: "B · Aurora",
    blurb: "Vetro scuro con i colori estratti dalle cover.",
    component: DirectionAurora,
  },
  {
    id: "indice",
    label: "C · Indice",
    blurb: "Brutalista/minimal: griglia, tabelle, monospace, lime.",
    component: DirectionIndex,
  },
  {
    id: "lato-b",
    label: "D · Lato B",
    blurb: "Retrò vinile anni '70: buste, dischi, toni caldi.",
    component: DirectionVinyl,
  },
  {
    id: "loghi",
    label: "Loghi",
    blurb: "Tre concept “pivi” + favicon, chiaro e scuro.",
    component: LogoGallery,
  },
];

const THEMES = [
  { id: "light", label: "Chiaro" },
  { id: "dark", label: "Scuro" },
] as const;

const SCREENS = [
  { id: "sistema", label: "Palette & tipografia" },
  { id: "home", label: "Home" },
  { id: "playlist", label: "Playlist" },
  { id: "stats", label: "Stats" },
  { id: "serie", label: "Serie" },
] as const;

const route = useRoute();
const router = useRouter();

const active = computed(
  () => TABS.find((tab) => tab.id === route.query.d) ?? (TABS[0] as LabTab),
);
const theme = computed(() => (route.query.t === "dark" ? "dark" : "light"));
const isDirection = computed(() => active.value.id !== "loghi");

/**
 * Updates one query parameter, keeping the others.
 * @param key - The parameter
 * @param value - Its new value
 * @returns Resolves once navigation completes
 */
async function setQuery(key: "d" | "t", value: string): Promise<void> {
  await router.replace({ query: { ...route.query, [key]: value } });
}

/**
 * Scrolls the chosen screen of the current direction into view.
 * @param id - The screen id
 * @returns Nothing
 */
function jumpTo(id: string): void {
  document
    .getElementById(`${active.value.id}-${id}`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <div class="lab">
    <header class="lab__bar">
      <div class="lab__title">
        <strong>Design lab</strong>
        <span>music.pivi.dev · dati di esempio inventati</span>
      </div>
      <nav class="lab__tabs" aria-label="Direzioni di design">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          type="button"
          class="lab__tab"
          :aria-pressed="tab.id === active.id"
          @click="setQuery('d', tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>
      <div class="lab__tools">
        <div class="lab__segmented" role="group" aria-label="Tema">
          <button
            v-for="option in THEMES"
            :key="option.id"
            type="button"
            :aria-pressed="theme === option.id"
            @click="setQuery('t', option.id)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </header>
    <div class="lab__sub">
      <p>{{ active.blurb }}</p>
      <nav v-if="isDirection" class="lab__screens" aria-label="Schermate">
        <button
          v-for="screen in SCREENS"
          :key="screen.id"
          type="button"
          @click="jumpTo(screen.id)"
        >
          {{ screen.label }}
        </button>
      </nav>
    </div>
    <main class="lab__stage">
      <component
        :is="active.component"
        :key="active.id"
        :theme="theme"
        :prefix="active.id"
      />
    </main>
  </div>
</template>

<style scoped>
.lab {
  min-height: 100vh;
  background: #e9e9ec;
  color: #16161a;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.lab__bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  padding: 10px 16px;
  background: #16161a;
  color: #f4f4f6;
}
.lab__title {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  font-size: 13px;
}
.lab__title span {
  color: #a6a6b0;
  font-size: 11px;
}
.lab__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}
.lab__tab,
.lab__segmented button,
.lab__screens button {
  border: 1px solid #3a3a44;
  background: transparent;
  color: inherit;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}
.lab__tab[aria-pressed="true"],
.lab__segmented button[aria-pressed="true"] {
  background: #f4f4f6;
  color: #16161a;
  border-color: #f4f4f6;
}
.lab__segmented {
  display: flex;
  gap: 4px;
}
.lab__sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 10px 16px;
  font-size: 14px;
  border-bottom: 1px solid #d4d4da;
}
.lab__sub p {
  margin: 0;
}
.lab__screens {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.lab__screens button {
  border-color: #b9b9c2;
  font-size: 12px;
  padding: 4px 10px;
}
.lab__stage {
  padding: 16px;
}
@media (min-width: 900px) {
  .lab__stage {
    padding: 24px;
  }
}
</style>
