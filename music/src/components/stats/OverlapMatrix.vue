<script setup lang="ts">
/**
 * OverlapMatrix component
 * Jaccard similarity of artist sets between playlists, as a shaded grid.
 * Shading uses `--matrix-hi` over `--matrix-lo`.
 */
import { computed } from "vue";

import type { OverlapMatrix } from "@/services/stats";
import { formatPercent } from "@/utils/format.ts";

const props = withDefaults(
  defineProps<{
    /** The matrix to draw. */
    matrix: OverlapMatrix;

    /** Short label of each playlist, in matrix order. */
    labels: readonly string[];

    /** Cell size in pixels. */
    cell?: number;
  }>(),
  { cell: 26 },
);

const LEGEND = 34;
const size = computed(() => LEGEND + props.labels.length * props.cell);

/* Off-diagonal values are small; scale to the largest one so the grid has range. */
const max = computed(() => {
  let highest = 0;
  props.matrix.values.forEach((row, i) =>
    row.forEach((value, j) => {
      if (i !== j) highest = Math.max(highest, value);
    }),
  );
  return highest || 1;
});
</script>

<template>
  <div
    class="matrix"
    tabindex="0"
    aria-label="Matrice di similarità Jaccard tra playlist"
  >
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      role="img"
      aria-label="Similarità Jaccard degli artisti tra playlist"
    >
      <text
        v-for="(label, index) in labels"
        :key="`c${label}`"
        :x="LEGEND + index * cell + cell / 2"
        y="22"
        text-anchor="middle"
        class="matrix__label"
      >
        {{ label }}
      </text>
      <text
        v-for="(label, index) in labels"
        :key="`r${label}`"
        x="28"
        :y="LEGEND + index * cell + cell / 2 + 4"
        text-anchor="end"
        class="matrix__label"
      >
        {{ label }}
      </text>
      <g v-for="(row, i) in matrix.values" :key="i">
        <rect
          v-for="(value, j) in row"
          :key="j"
          :x="LEGEND + j * cell + 1"
          :y="LEGEND + i * cell + 1"
          :width="cell - 2"
          :height="cell - 2"
          rx="3"
          :class="i === j ? 'matrix__cell matrix__cell--self' : 'matrix__cell'"
          :style="
            i === j ? undefined : { fillOpacity: 0.08 + (value / max) * 0.92 }
          "
        >
          <title>
            {{ labels[i] }} × {{ labels[j] }}: {{ formatPercent(value) }}
          </title>
        </rect>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.matrix {
  overflow-x: auto;
}
.matrix:focus-visible {
  outline: 2px solid var(--focus, currentColor);
  outline-offset: 2px;
}
.matrix__label {
  font-size: 10px;
  fill: var(--chart-muted, currentColor);
  font-variant-numeric: tabular-nums;
}
.matrix__cell {
  fill: var(--matrix-hi, currentColor);
}
.matrix__cell--self {
  fill: var(--matrix-lo, transparent);
}
</style>
