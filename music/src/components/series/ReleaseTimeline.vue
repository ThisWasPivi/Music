<script setup lang="ts">
/**
 * ReleaseTimeline component
 * One glowing ball per issue on a real time axis, so dense runs and pauses
 * show up as they happened. Each ball is painted with its own cover colours;
 * the axis draws itself left to right and the balls pop in as it reaches
 * them. Balls link to their issue and show a tooltip.
 */
import { computed, useId } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import type { Release } from "@/services/stats";
import { vivid } from "@/utils/color.ts";
import { formatDate } from "@/utils/format.ts";

const props = withDefaults(
  defineProps<{
    /** Releases in chronological order. */
    releases: readonly Release[];

    /** Release closing the longest gap, drawn larger with a ring. */
    highlight?: Release | null;
  }>(),
  { highlight: null },
);

const { t } = useI18n();
const router = useRouter();
const id = useId();
const WIDTH = 1000;
const HEIGHT = 150;
const PAD = 30;
const AXIS_Y = 78;
const RADIUS = 11;
/* The axis draws itself left to right; each ball appears as the line reaches it. */
const SWEEP_MS = 1400;

const range = computed(() => {
  const times = props.releases.map((release) => Date.parse(release.releasedAt));
  const start = Math.min(...times);
  return { start, span: Math.max(1, Math.max(...times) - start) };
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
  props.releases.map((release, index) => {
    const [first = "#7c3aed", second = first] = release.playlist.palette;
    return {
      release,
      x: x(release.releasedAt),
      above: index % 2 === 0,
      label:
        release.playlist.number === null
          ? "R"
          : String(release.playlist.number),
      inner: vivid(second),
      outer: vivid(first),
      tooltip: t("series.ballTooltip", {
        name: release.playlist.name,
        date: formatDate(release.releasedAt),
        tracks: t(
          "common.tracks",
          { n: release.playlist.trackCount },
          release.playlist.trackCount,
        ),
      }),
    };
  }),
);

/** 1 January of every year the axis covers. */
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

const summary = computed(() =>
  t("series.timelineSummary", {
    n: props.releases.length,
    from: formatDate(props.releases[0]?.releasedAt ?? null),
    to: formatDate(props.releases.at(-1)?.releasedAt ?? null),
  }),
);

/**
 * Opens an issue from its ball.
 * @param release - The clicked release
 * @returns Resolves after navigation
 */
async function open(release: Release): Promise<void> {
  await router.push({ name: "playlist", params: { id: release.playlist.id } });
}
</script>

<template>
  <div class="timeline">
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" role="group" :aria-label="summary">
      <defs>
        <linearGradient
          :id="`${id}-axis`"
          gradientUnits="userSpaceOnUse"
          :x1="PAD"
          :y1="AXIS_Y"
          :x2="WIDTH - PAD"
          :y2="AXIS_Y"
        >
          <stop offset="0" class="timeline__stop timeline__stop--1" />
          <stop offset="0.5" class="timeline__stop timeline__stop--2" />
          <stop offset="1" class="timeline__stop timeline__stop--3" />
        </linearGradient>
        <radialGradient
          v-for="(point, index) in points"
          :id="`${id}-ball-${index}`"
          :key="point.release.playlist.id"
          cx="0.35"
          cy="0.3"
          r="0.75"
        >
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.85" />
          <stop offset="0.25" :stop-color="point.inner" />
          <stop offset="1" :stop-color="point.outer" />
        </radialGradient>
      </defs>

      <line
        :x1="PAD"
        :x2="WIDTH - PAD"
        :y1="AXIS_Y"
        :y2="AXIS_Y"
        pathLength="1"
        :stroke="`url(#${id}-axis)`"
        class="timeline__axis"
        :style="{ animationDuration: `${SWEEP_MS}ms` }"
      />
      <g v-for="tick in yearTicks" :key="tick.label" aria-hidden="true">
        <line
          :x1="tick.x"
          :x2="tick.x"
          :y1="AXIS_Y - 46"
          :y2="AXIS_Y + 46"
          class="timeline__tick"
        />
        <text :x="tick.x + 6" :y="HEIGHT - 6" class="timeline__year">
          {{ tick.label }}
        </text>
      </g>

      <a
        v-for="(point, index) in points"
        :key="point.release.playlist.id"
        v-tooltip="point.tooltip"
        :href="
          router.resolve({
            name: 'playlist',
            params: { id: point.release.playlist.id },
          }).href
        "
        :aria-label="point.tooltip"
        class="timeline__point"
        :style="{
          animationDelay: `${(point.x / WIDTH) * SWEEP_MS}ms`,
          '--glow': point.outer,
        }"
        @click.prevent="open(point.release)"
      >
        <line
          :x1="point.x"
          :x2="point.x"
          :y1="AXIS_Y"
          :y2="point.above ? AXIS_Y - 26 : AXIS_Y + 26"
          class="timeline__stem"
          :style="{ stroke: point.outer }"
        />
        <circle
          v-if="point.release === highlight"
          :cx="point.x"
          :cy="AXIS_Y"
          :r="RADIUS + 5"
          class="timeline__ring"
          :style="{ stroke: point.outer }"
        />
        <circle
          :cx="point.x"
          :cy="AXIS_Y"
          :r="RADIUS"
          :fill="`url(#${id}-ball-${index})`"
          class="timeline__ball"
        />
        <text
          :x="point.x"
          :y="point.above ? AXIS_Y - 32 : AXIS_Y + 42"
          text-anchor="middle"
          class="timeline__label"
          :style="{ fill: point.outer }"
        >
          {{ point.label }}
        </text>
      </a>
    </svg>
  </div>
</template>

<style scoped>
.timeline {
  overflow-x: auto;
  overscroll-behavior-x: contain;
}
.timeline svg {
  display: block;
  min-inline-size: 640px;
  inline-size: 100%;
  block-size: auto;
  overflow: visible;
}
.timeline__axis {
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 1;
  animation: timeline-draw ease-in-out both;
}
.timeline__stop--1 {
  stop-color: var(--c1);
}
.timeline__stop--2 {
  stop-color: var(--c2);
}
.timeline__stop--3 {
  stop-color: var(--c3);
}
@keyframes timeline-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}
.timeline__tick {
  stroke: var(--chart-grid);
  stroke-dasharray: 2 5;
}
.timeline__year {
  font: 600 12px var(--font-body);
  fill: var(--chart-muted);
}
.timeline__point {
  cursor: pointer;
  animation: timeline-pop 520ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}
.timeline__point:focus-visible {
  outline: none;
}
@keyframes timeline-pop {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
.timeline__stem {
  stroke-width: 1.5;
  stroke-opacity: 0.6;
}
.timeline__ball {
  stroke: var(--bg);
  stroke-width: 2.5;
  transform-box: fill-box;
  transform-origin: center;
  filter: drop-shadow(0 0 6px var(--glow));
  transition:
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 220ms ease;
}
.timeline__ring {
  fill: none;
  stroke-width: 2;
  stroke-dasharray: 3 3;
}
.timeline__point:hover .timeline__ball,
.timeline__point:focus-visible .timeline__ball {
  transform: scale(1.4);
  filter: drop-shadow(0 0 12px var(--glow));
}
.timeline__point:focus-visible .timeline__ball {
  stroke: var(--focus);
  stroke-width: 3;
}
.timeline__label {
  font: 800 13px var(--font-display);
  font-variant-numeric: tabular-nums;
  paint-order: stroke;
  stroke: var(--bg);
  stroke-width: 3px;
}
</style>
