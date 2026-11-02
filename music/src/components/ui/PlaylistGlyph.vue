<script setup lang="ts">
/**
 * PlaylistGlyph component
 * A playlist drawn as its own fingerprint: one ray per track around a
 * disc, in tracklist order clockwise from the top. A ray's length is the
 * track's duration, its colour the year it came out (violet for older,
 * through blue and cyan, to pink for recent), and a dot at its tip marks
 * an explicit track. The disc in the middle takes the cover's colour.
 * Two playlists only share a glyph if they share every track.
 */
import type { Playlist } from "@music/shared";
import { computed, useId } from "vue";

import { auroraTint, colourfulOf } from "@/utils/color.ts";

const props = defineProps<{
  /** The playlist to draw. */
  playlist: Playlist;
}>();

const id = useId();

/* Geometry in viewBox units: a 100 × 100 square centred on 50, 50. */
const INNER = 15;
const REACH = 29;
/* Durations mapped onto the ray length, clamped at both ends. */
const SHORTEST_MS = 90_000;
const LONGEST_MS = 420_000;
/* Release years mapped onto the colour scale. */
const OLDEST_YEAR = 1960;
const NEWEST_YEAR = new Date().getFullYear();

/**
 * One track as a ray.
 * @property x1 - Inner end, x
 * @property y1 - Inner end, y
 * @property x2 - Outer end, x
 * @property y2 - Outer end, y
 * @property color - Release-year colour
 * @property explicit - Whether to mark the tip
 */
interface Ray {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  explicit: boolean;
}

const rays = computed<Ray[]>(() => {
  const tracks = props.playlist.tracks;
  const count = Math.max(1, tracks.length);
  return tracks.map((track, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    const share = Math.min(
      1,
      Math.max(
        0,
        (track.durationMs - SHORTEST_MS) / (LONGEST_MS - SHORTEST_MS),
      ),
    );
    const outer = INNER + 6 + share * (REACH - 6);
    const year = track.releaseYear ?? NEWEST_YEAR;
    const age = (year - OLDEST_YEAR) / (NEWEST_YEAR - OLDEST_YEAR);
    return {
      x1: 50 + Math.cos(angle) * INNER,
      y1: 50 + Math.sin(angle) * INNER,
      x2: 50 + Math.cos(angle) * outer,
      y2: 50 + Math.sin(angle) * outer,
      color: auroraTint(age),
      explicit: track.explicit,
    };
  });
});

/* Thinner rays when there are many tracks, so they never merge. */
const strokeWidth = computed(() =>
  Math.max(0.9, Math.min(3.2, 90 / Math.max(1, rays.value.length))),
);

const core = computed(
  () =>
    colourfulOf(props.playlist.palette)[0] ??
    props.playlist.palette[0] ??
    "#7c3aed",
);
</script>

<template>
  <svg viewBox="0 0 100 100" class="glyph" role="img">
    <defs>
      <radialGradient :id="`${id}-core`" cx="0.38" cy="0.32" r="0.75">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.65" />
        <stop offset="0.5" :stop-color="core" />
        <stop offset="1" :stop-color="core" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" class="glyph__plate" />
    <circle cx="50" cy="50" :r="INNER + 6" class="glyph__groove" />
    <circle
      cx="50"
      cy="50"
      :r="INNER + 6 + (REACH - 6) / 2"
      class="glyph__groove"
    />
    <g :stroke-width="strokeWidth" stroke-linecap="round">
      <line
        v-for="(ray, index) in rays"
        :key="index"
        :x1="ray.x1"
        :y1="ray.y1"
        :x2="ray.x2"
        :y2="ray.y2"
        :stroke="ray.color"
        class="glyph__ray"
        :style="{ '--i': index }"
      />
    </g>
    <template v-for="(ray, index) in rays" :key="`dot-${index}`">
      <circle
        v-if="ray.explicit"
        :cx="ray.x2"
        :cy="ray.y2"
        :r="strokeWidth * 0.6 + 0.6"
        class="glyph__dot"
      />
    </template>
    <circle cx="50" cy="50" :r="INNER - 3" :fill="`url(#${id}-core)`" />
    <circle cx="50" cy="50" r="1.6" class="glyph__hole" />
  </svg>
</template>

<style scoped>
.glyph {
  display: block;
  overflow: visible;
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 1;
}
.glyph__plate {
  fill: color-mix(in oklab, var(--bg) 70%, transparent);
  stroke: var(--line);
  stroke-width: 0.6;
}
.glyph__groove {
  fill: none;
  stroke: var(--line);
  stroke-width: 0.4;
  stroke-dasharray: 1 2;
}
.glyph__ray {
  animation: ray-in 700ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--i) * 12ms);
  transform-box: view-box;
  transform-origin: 50px 50px;
}
@keyframes ray-in {
  from {
    opacity: 0;
    transform: scale(0.4) rotate(-20deg);
  }
}
.glyph__dot {
  fill: var(--text);
}
.glyph__hole {
  fill: var(--bg);
}
</style>
