<script setup lang="ts">
/**
 * HeatmapCalendar component
 * GitHub-style calendar of the days tracks were added. Colours come from the
 * `--heat-0` … `--heat-4` custom properties of the surrounding theme.
 */
import { computed } from "vue";

import type { Heatmap } from "@/services/stats";
import { formatNumber } from "@/utils/format.ts";

const props = withDefaults(
  defineProps<{
    /** The calendar to draw. */
    heatmap: Heatmap;

    /** Cell size in pixels. */
    cell?: number;

    /** Gap between cells in pixels. */
    gap?: number;
  }>(),
  { cell: 11, gap: 3 },
);

const MONTHS = [
  "gen",
  "feb",
  "mar",
  "apr",
  "mag",
  "giu",
  "lug",
  "ago",
  "set",
  "ott",
  "nov",
  "dic",
];
const LABEL_HEIGHT = 16;

const pitch = computed(() => props.cell + props.gap);
const width = computed(() => props.heatmap.weeks.length * pitch.value);
const height = computed(() => LABEL_HEIGHT + 7 * pitch.value);

/** A month label above the first week that starts in that month. */
const monthLabels = computed(() => {
  const labels: { x: number; text: string }[] = [];
  let previous = -1;
  props.heatmap.weeks.forEach((week, index) => {
    const month = Number(week[0]?.date.slice(5, 7)) - 1;
    if (month !== previous) {
      const year = week[0]?.date.slice(2, 4);
      labels.push({
        x: index * pitch.value,
        text: month === 0 ? `${MONTHS[month]} '${year}` : (MONTHS[month] ?? ""),
      });
      previous = month;
    }
  });
  return labels;
});

/**
 * Maps a daily count to one of five intensity levels.
 * @param count - Tracks added that day
 * @returns The level, 0 for none
 */
function level(count: number): number {
  if (count === 0 || props.heatmap.max === 0) return 0;
  return Math.min(4, Math.ceil((count / props.heatmap.max) * 4));
}

const summary = computed(
  () =>
    `${formatNumber(props.heatmap.total)} brani aggiunti in ${props.heatmap.weeks.length} settimane`,
);
</script>

<template>
  <figure class="heatmap">
    <div class="heatmap__scroll" tabindex="0" :aria-label="summary">
      <svg
        :width="width"
        :height="height"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        :aria-label="summary"
      >
        <text
          v-for="label in monthLabels"
          :key="label.x"
          :x="label.x"
          y="10"
          class="heatmap__label"
        >
          {{ label.text }}
        </text>
        <g
          v-for="(week, column) in heatmap.weeks"
          :key="week[0]?.date"
          :transform="`translate(${column * pitch} ${LABEL_HEIGHT})`"
          :style="{ '--d': `${column * 10}ms` }"
        >
          <rect
            v-for="(day, row) in week"
            :key="day.date"
            :y="row * pitch"
            :width="cell"
            :height="cell"
            rx="2"
            :class="`heatmap__cell heatmap__cell--${level(day.count)}`"
          >
            <title>{{ day.date }}: {{ day.count }} brani</title>
          </rect>
        </g>
      </svg>
    </div>
    <figcaption class="heatmap__legend">
      <span>meno</span>
      <svg
        v-for="step in 5"
        :key="step"
        width="11"
        height="11"
        aria-hidden="true"
      >
        <rect
          width="11"
          height="11"
          rx="2"
          :class="`heatmap__cell heatmap__cell--${step - 1}`"
        />
      </svg>
      <span>più</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.heatmap {
  margin: 0;
}
.heatmap__scroll {
  overflow-x: auto;
  padding-bottom: 4px;
}
.heatmap__scroll:focus-visible {
  outline: 2px solid var(--focus, currentColor);
  outline-offset: 2px;
}
.heatmap__label {
  font-size: 10px;
  fill: var(--chart-muted, currentColor);
}
g .heatmap__cell {
  transform-box: fill-box;
  transform-origin: center;
  animation: heat-pop 500ms cubic-bezier(0.2, 0.8, 0.2, 1) var(--d, 0ms)
    backwards;
  transition:
    transform 150ms ease,
    filter 150ms ease;
}
g .heatmap__cell:hover {
  transform: scale(1.5);
  filter: brightness(1.3);
}
@keyframes heat-pop {
  from {
    opacity: 0;
    transform: scale(0.2);
  }
}
.heatmap__cell--0 {
  fill: var(--heat-0);
}
.heatmap__cell--1 {
  fill: var(--heat-1);
}
.heatmap__cell--2 {
  fill: var(--heat-2);
}
.heatmap__cell--3 {
  fill: var(--heat-3);
}
.heatmap__cell--4 {
  fill: var(--heat-4);
}
.heatmap__legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--chart-muted, currentColor);
}
</style>
