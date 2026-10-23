<script setup lang="ts">
/**
 * ColumnChart component
 * Vertical bars over a categorical axis, sized by `viewBox` so it scales to
 * its container. Uses `--bar`, `--bar-highlight` and `--chart-muted`.
 */
import { computed } from "vue";

/**
 * One column.
 * @property key - Stable key
 * @property label - Axis label
 * @property value - Column height
 * @property title - Tooltip text
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

    /** Drawing height in viewBox units. */
    height?: number;

    /** Show every n-th axis label. */
    labelEvery?: number;
  }>(),
  { height: 160, labelEvery: 1 },
);

const WIDTH = 600;
const AXIS = 18;

const max = computed(() =>
  Math.max(1, ...props.columns.map((column) => column.value)),
);
const slot = computed(() => WIDTH / Math.max(1, props.columns.length));
const barWidth = computed(() => Math.max(2, slot.value * 0.68));
</script>

<template>
  <svg
    class="columns"
    :viewBox="`0 0 ${WIDTH} ${height + AXIS}`"
    role="img"
    :aria-label="label"
  >
    <line x1="0" :x2="WIDTH" :y1="height" :y2="height" class="columns__axis" />
    <g v-for="(column, index) in columns" :key="column.key">
      <rect
        :x="index * slot + (slot - barWidth) / 2"
        :y="height - (column.value / max) * (height - 4)"
        :width="barWidth"
        :height="(column.value / max) * (height - 4)"
        :class="
          column.highlight
            ? 'columns__bar columns__bar--highlight'
            : 'columns__bar'
        "
      >
        <title>{{ column.title }}</title>
      </rect>
      <text
        v-if="index % labelEvery === 0"
        :x="index * slot + slot / 2"
        :y="height + AXIS - 4"
        text-anchor="middle"
        class="columns__label"
      >
        {{ column.label }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.columns {
  display: block;
  inline-size: 100%;
  block-size: auto;
  overflow: visible;
}
.columns__axis {
  stroke: var(--chart-grid, currentColor);
  stroke-width: 1;
}
.columns__bar {
  fill: var(--bar-fill, var(--bar, currentColor));
}
.columns__bar--highlight {
  fill: var(--bar-highlight, var(--bar, currentColor));
}
.columns__label {
  font-size: 11px;
  fill: var(--chart-muted, currentColor);
}
</style>
