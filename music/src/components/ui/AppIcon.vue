<script setup lang="ts">
/**
 * AppIcon component
 * Small line icons drawn on a 24-unit grid with the current text colour,
 * sized by the font size. Decorative: the control they sit in carries the
 * accessible name.
 */

/** Names of the available icons. */
export type IconName =
  | "hash"
  | "text"
  | "tracks"
  | "clock"
  | "palette"
  | "info"
  | "code"
  | "heart"
  | "arrow-up"
  | "arrow-down"
  | "external"
  | "grid"
  | "chart"
  | "timeline";

defineProps<{
  /** Which icon to draw. */
  name: IconName;
}>();

/* Path data per icon, stroked with round caps and joins. */
const PATHS: Record<IconName, string[]> = {
  hash: ["M4 9h16", "M4 15h16", "M10 3 8 21", "M16 3l-2 18"],
  text: ["M4 7V5h16v2", "M12 5v14", "M9 19h6"],
  tracks: [
    "M9 18V5l12-2v13",
    "M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    "M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  ],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"],
  palette: [
    "M12 21a9 9 0 1 1 9-9c0 2.5-2 3.5-4 3.5h-1.6a1.8 1.8 0 0 0-1.3 3.1A1.5 1.5 0 0 1 12 21Z",
    "M7.5 11.5h.01",
    "M10.5 7.5h.01",
    "M15.5 8.5h.01",
  ],
  info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 16v-4.5", "M12 8h.01"],
  code: ["m8 7-5 5 5 5", "m16 7 5 5-5 5", "m14 4-4 16"],
  heart: [
    "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  ],
  "arrow-up": ["M12 19V5", "m6 11 6-6 6 6"],
  "arrow-down": ["M12 5v14", "m6 13 6 6 6-6"],
  grid: ["M4 4h7v7H4Z", "M13 4h7v7h-7Z", "M4 13h7v7H4Z", "M13 13h7v7h-7Z"],
  chart: ["M4 20h16", "M7 16v-5", "M12 16V6", "M17 16v-8"],
  timeline: [
    "M3 12h18",
    "M9 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
    "M16 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
    "M7 6v2",
    "M14 16v2",
    "M19 6v2",
  ],
  external: [
    "M14 4h6v6",
    "M20 4 11 13",
    "M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5",
  ],
};
</script>

<template>
  <svg
    class="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="path in PATHS[name]" :key="path" :d="path" />
  </svg>
</template>

<style scoped>
.icon {
  flex: none;
  inline-size: 1.15em;
  block-size: 1.15em;
  vertical-align: -0.2em;
}
</style>
