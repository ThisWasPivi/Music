<script setup lang="ts">
/**
 * ColumnChart component
 * Vertical bars with rounded tops in the aurora gradient. Bars rise from
 * the baseline one after another on mount and glide to new heights when
 * the data changes; hovering or focusing a bar shows its tooltip.
 */
import { computed } from "vue";

import { useEntered } from "@/composables/useEntered.ts";

/**
 * One column.
 * @property key - Stable key
 * @property label - Axis label
 * @property value - Column height
 * @property tooltip - Tooltip and accessible text
 * @property highlight - Draws the column in the highlight colour
 */
export interface Column {
  key: string;
  label: string;
  value: number;
  tooltip: string;
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
  { height: 200, labelEvery: 1 },
);

const entered = useEntered();
const max = computed(() =>
  Math.max(1, ...props.columns.map((column) => column.value)),
);
</script>

<template>
  <figure class="columns" role="group" :aria-label="label">
    <div class="columns__plot" :style="{ blockSize: `${height}px` }">
      <span class="columns__max tabular" aria-hidden="true">{{ max }}</span>
      <div
        v-for="(column, index) in columns"
        :key="column.key"
        v-tooltip="column.tooltip"
        class="columns__slot"
        tabindex="0"
        role="img"
        :aria-label="column.tooltip"
      >
        <span
          class="columns__bar"
          :class="{ 'columns__bar--highlight': column.highlight }"
          :style="{
            blockSize: entered
              ? `${Math.max(column.value > 0 ? 2 : 0, (column.value / max) * 100)}%`
              : '0%',
            transitionDelay: entered ? `${index * 28}ms` : '0ms',
          }"
        />
      </div>
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
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  align-items: end;
  gap: clamp(3px, 0.8vw, 10px);
  padding-top: 18px;
  border-bottom: 1px solid var(--chart-grid);
  background-image: linear-gradient(var(--chart-grid) 1px, transparent 1px);
  background-size: 100% 50%;
  background-position: 0 18px;
  background-repeat: repeat-y;
  background-clip: content-box;
}
.columns__max {
  position: absolute;
  inset: 0 0 auto auto;
  font-size: 11px;
  color: var(--chart-muted);
}
.columns__slot {
  position: relative;
  display: flex;
  align-items: flex-end;
  block-size: 100%;
  border-radius: 10px 10px 0 0;
  cursor: default;
}
.columns__slot:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
.columns__bar {
  display: block;
  inline-size: 100%;
  border-radius: 10px 10px 3px 3px;
  background: linear-gradient(180deg, var(--bar-top), var(--bar-bottom));
  box-shadow: 0 -6px 18px -10px var(--bar-top);
  transition:
    block-size 900ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 200ms ease,
    transform 200ms ease;
  transform-origin: bottom;
}
.columns__bar--highlight {
  background: linear-gradient(180deg, var(--c3), var(--c1));
}
.columns__slot:hover .columns__bar,
.columns__slot:focus-visible .columns__bar {
  filter: brightness(1.15) saturate(1.2);
  transform: scaleX(1.06);
}
.columns__axis {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: clamp(3px, 0.8vw, 10px);
  margin-top: 8px;
  font-size: 11px;
  color: var(--chart-muted);
  text-align: center;
}
.columns__axis span {
  white-space: nowrap;
}
</style>
