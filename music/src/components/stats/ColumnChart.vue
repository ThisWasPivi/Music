<script setup lang="ts">
/**
 * ColumnChart component
 * Vertical bars over a categorical axis. Bars stretch to the container
 * width at a fixed height; labels are HTML so they keep their size.
 * Uses `--bar-fill`, `--bar-highlight`, `--chart-grid` and `--chart-muted`.
 */
import { computed, useId } from "vue";

/**
 * One column.
 * @property key - Stable key
 * @property label - Axis label
 * @property value - Column height
 * @property title - Tooltip and accessible text
 * @property highlight - Draws the column in the highlight colour
 */
export interface Column {
  key: string;
  label: string;
  value: number;
  title: string;
  highlight?: boolean;
}

const props = withDefaults(
  defineProps<{
    /** Columns, in axis order. */
    columns: readonly Column[];

    /** Accessible summary of the chart. */
    label: string;

    /** Plot height in pixels. */
    height?: number;

    /** Show every n-th axis label. */
    labelEvery?: number;
  }>(),
  { height: 180, labelEvery: 1 },
);

const gradient = `${useId()}-bars`;
const max = computed(() =>
  Math.max(1, ...props.columns.map((column) => column.value)),
);
const peak = computed(() =>
  props.columns.reduce(
    (best, column) => (column.value > (best?.value ?? -1) ? column : best),
    props.columns[0],
  ),
);
</script>

<template>
  <figure class="columns" :aria-label="label" role="group">
    <div class="columns__plot" :style="{ blockSize: `${height}px` }">
      <span class="columns__max tabular" aria-hidden="true">{{ max }}</span>
      <svg
        :viewBox="`0 0 ${Math.max(1, columns.length)} 100`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="`${label}. Massimo: ${peak?.title ?? '—'}`"
      >
        <defs>
          <linearGradient :id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" class="columns__stop-top" />
            <stop offset="1" class="columns__stop-bottom" />
          </linearGradient>
        </defs>
        <line
          x1="0"
          :x2="columns.length"
          y1="0"
          y2="0"
          class="columns__grid"
          vector-effect="non-scaling-stroke"
        />
        <line
          x1="0"
          :x2="columns.length"
          y1="50"
          y2="50"
          class="columns__grid"
          vector-effect="non-scaling-stroke"
        />
        <rect
          v-for="(column, index) in columns"
          :key="column.key"
          :x="index + 0.16"
          :y="100 - (column.value / max) * 100"
          width="0.68"
          :height="(column.value / max) * 100"
          :fill="column.highlight ? undefined : `url(#${gradient})`"
          :style="{
            y: `${100 - (column.value / max) * 100}px`,
            height: `${(column.value / max) * 100}px`,
            animationDelay: `${index * 35}ms`,
          }"
          :class="
            column.highlight
              ? 'columns__bar columns__bar--highlight'
              : 'columns__bar'
          "
        >
          <title>{{ column.title }}</title>
        </rect>
      </svg>
    </div>
    <div class="columns__axis" aria-hidden="true">
      <span
        v-for="(column, index) in columns"
        :key="column.key"
        class="tabular"
      >
        {{ index % labelEvery === 0 ? column.label : "" }}
      </span>
    </div>
  </figure>
</template>

<style scoped>
.columns {
  margin: 0;
}
.columns__plot {
  position: relative;
  border-bottom: 1px solid var(--chart-grid, currentColor);
}
.columns__plot svg {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}
.columns__max {
  position: absolute;
  inset: -2px 0 auto auto;
  transform: translateY(-100%);
  font-size: 11px;
  color: var(--chart-muted, currentColor);
}
.columns__grid {
  stroke: var(--chart-grid, currentColor);
  stroke-dasharray: 2 4;
}
.columns__stop-top {
  stop-color: var(--bar-top, var(--bar-fill, currentColor));
}
.columns__stop-bottom {
  stop-color: var(--bar-bottom, var(--bar-fill, currentColor));
}
.columns__bar {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: columns-grow 800ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
  transition:
    y 600ms cubic-bezier(0.2, 0.8, 0.2, 1),
    height 600ms cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 200ms ease;
}
.columns__bar:hover {
  filter: brightness(1.3) saturate(1.2);
}
@keyframes columns-grow {
  from {
    transform: scaleY(0);
  }
}
.columns__bar--highlight {
  fill: var(--bar-highlight, var(--bar-fill, currentColor));
}
.columns__axis {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  margin-top: 6px;
  font-size: 11px;
  color: var(--chart-muted, currentColor);
  text-align: center;
}
.columns__axis span {
  overflow: visible;
  white-space: nowrap;
}
</style>
