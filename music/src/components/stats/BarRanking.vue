<script setup lang="ts">
/**
 * BarRanking component
 * Ordered list with a proportional bar per row. Bar colours come from the
 * `--bar` and `--bar-track` custom properties.
 */
import { computed } from "vue";

/**
 * One row of the ranking.
 * @property key - Stable key
 * @property label - Main text
 * @property sublabel - Optional secondary text
 * @property value - Numeric value the bar is proportional to
 * @property display - Formatted value shown at the end of the row
 */
export interface BarRow {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  display: string;
}

const props = defineProps<{
  /** Rows, already sorted. */
  rows: readonly BarRow[];

  /** Links each label to the named route, with the row key as `id`. */
  link?: string;
}>();

const max = computed(() => Math.max(1, ...props.rows.map((row) => row.value)));
</script>

<template>
  <ol class="ranking">
    <li v-for="(row, index) in rows" :key="row.key" class="ranking__row">
      <span class="ranking__rank">{{ index + 1 }}</span>
      <span class="ranking__text">
        <RouterLink
          v-if="link"
          :to="{ name: link, params: { id: row.key } }"
          class="ranking__label"
        >
          {{ row.label }}
        </RouterLink>
        <span v-else class="ranking__label">{{ row.label }}</span>
        <span v-if="row.sublabel" class="ranking__sublabel">{{
          row.sublabel
        }}</span>
      </span>
      <span class="ranking__value">{{ row.display }}</span>
      <span class="ranking__track" aria-hidden="true">
        <span
          class="ranking__bar"
          :style="{ inlineSize: `${(row.value / max) * 100}%` }"
        />
      </span>
    </li>
  </ol>
</template>

<style scoped>
.ranking {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--ranking-gap, 10px);
}
.ranking__row {
  display: grid;
  grid-template-columns: 1.75em 1fr auto;
  grid-template-areas: "rank text value" ". track track";
  align-items: baseline;
  column-gap: 8px;
  row-gap: 4px;
}
.ranking__rank {
  grid-area: rank;
  font-variant-numeric: tabular-nums;
  color: var(--chart-muted, currentColor);
  font-size: 0.85em;
}
.ranking__text {
  grid-area: text;
  min-width: 0;
  display: flex;
  gap: 6px;
  align-items: baseline;
}
a.ranking__label {
  text-decoration: none;
}
a.ranking__label:hover {
  text-decoration: underline;
}
.ranking__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ranking__sublabel {
  color: var(--chart-muted, currentColor);
  font-size: 0.8em;
  white-space: nowrap;
}
.ranking__value {
  grid-area: value;
  font-variant-numeric: tabular-nums;
}
.ranking__track {
  grid-area: track;
  display: block;
  block-size: var(--bar-size, 6px);
  background: var(--bar-track, transparent);
  border-radius: var(--bar-radius, 999px);
  overflow: hidden;
}
.ranking__bar {
  display: block;
  block-size: 100%;
  background: var(--bar, currentColor);
  border-radius: inherit;
}
</style>
