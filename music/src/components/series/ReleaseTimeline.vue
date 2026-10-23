<script setup lang="ts">
/**
 * ReleaseTimeline component
 * One dot per issue on a real time axis, so dense runs and pauses show up as
 * they happened. Uses `--chart-ink`, `--chart-accent`, `--chart-muted` and
 * `--chart-grid`.
 */
import { computed } from "vue";

import type { Release } from "@/services/stats";
import { formatDate } from "@/utils/format.ts";

const props = withDefaults(
  defineProps<{
    /** Releases in chronological order. */
    releases: readonly Release[];

    /** Release closing the longest gap, drawn in the accent colour. */
    highlight?: Release | null;

    /** Dot radius in viewBox units. */
    radius?: number;

    /** Fills each dot with its issue's dominant cover colour. */
    colored?: boolean;
  }>(),
  { highlight: null, radius: 7, colored: false },
);

const WIDTH = 1000;
const HEIGHT = 130;
const PAD = 24;
const AXIS_Y = 70;

const range = computed(() => {
  const times = props.releases.map((release) => Date.parse(release.releasedAt));
  const start = Math.min(...times);
  const end = Math.max(...times);
  return { start, span: Math.max(1, end - start) };
});

/**
 * Projects a timestamp on the horizontal axis.
 * @param iso - An ISO timestamp
 * @returns The x coordinate in viewBox units
 */
function x(iso: string): number {
  return (
    PAD +
    ((Date.parse(iso) - range.value.start) / range.value.span) *
      (WIDTH - 2 * PAD)
  );
}

const points = computed(() =>
  props.releases.map((release, index) => ({
    release,
    x: x(release.releasedAt),
    above: index % 2 === 0,
    label:
      release.playlist.number === null ? "R" : String(release.playlist.number),
  })),
);

/** January 1st of every year the axis covers. */
const yearTicks = computed(() => {
  const first = new Date(range.value.start).getUTCFullYear() + 1;
  const last = new Date(range.value.start + range.value.span).getUTCFullYear();
  const ticks: { x: number; label: string }[] = [];
  for (let year = first; year <= last; year += 1) {
    ticks.push({
      x: x(new Date(Date.UTC(year, 0, 1)).toISOString()),
      label: String(year),
    });
  }
  return ticks;
});

const summary = computed(() => {
  const first = props.releases[0];
  const last = props.releases.at(-1);
  return `${props.releases.length} uscite dal ${formatDate(first?.releasedAt ?? null)} al ${formatDate(last?.releasedAt ?? null)}`;
});
</script>

<template>
  <div class="timeline" tabindex="0" :aria-label="summary">
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" role="img" :aria-label="summary">
      <line
        :x1="PAD"
        :x2="WIDTH - PAD"
        :y1="AXIS_Y"
        :y2="AXIS_Y"
        class="timeline__axis"
      />
      <g v-for="tick in yearTicks" :key="tick.label">
        <line
          :x1="tick.x"
          :x2="tick.x"
          :y1="AXIS_Y - 40"
          :y2="AXIS_Y + 40"
          class="timeline__tick"
        />
        <text :x="tick.x + 4" :y="HEIGHT - 4" class="timeline__year">
          {{ tick.label }}
        </text>
      </g>
      <g v-for="point in points" :key="point.release.playlist.id">
        <line
          :x1="point.x"
          :x2="point.x"
          :y1="AXIS_Y"
          :y2="point.above ? AXIS_Y - 22 : AXIS_Y + 22"
          class="timeline__stem"
        />
        <circle
          :cx="point.x"
          :cy="AXIS_Y"
          :r="radius"
          :class="
            point.release === highlight
              ? 'timeline__dot timeline__dot--highlight'
              : 'timeline__dot'
          "
          :style="
            colored ? { fill: point.release.playlist.palette[0] } : undefined
          "
        >
          <title>
            {{ point.release.playlist.name }} ·
            {{ formatDate(point.release.releasedAt) }}
          </title>
        </circle>
        <text
          :x="point.x"
          :y="point.above ? AXIS_Y - 27 : AXIS_Y + 36"
          text-anchor="middle"
          class="timeline__label"
        >
          {{ point.label }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.timeline {
  overflow-x: auto;
}
.timeline:focus-visible {
  outline: 2px solid var(--focus, currentColor);
  outline-offset: 2px;
}
.timeline svg {
  display: block;
  min-inline-size: 640px;
  inline-size: 100%;
  block-size: auto;
}
.timeline__axis {
  stroke: var(--chart-ink, currentColor);
  stroke-width: 2;
}
.timeline__tick {
  stroke: var(--chart-grid, currentColor);
  stroke-dasharray: 2 4;
}
.timeline__year {
  font-size: 12px;
  fill: var(--chart-muted, currentColor);
}
.timeline__stem {
  stroke: var(--chart-grid, currentColor);
}
.timeline__dot {
  fill: var(--chart-ink, currentColor);
  stroke: var(--chart-bg, transparent);
  stroke-width: 2;
}
.timeline__dot--highlight {
  fill: var(--chart-accent, currentColor);
}
.timeline__label {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  fill: var(--chart-ink, currentColor);
}
</style>
