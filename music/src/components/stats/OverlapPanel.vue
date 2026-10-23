<script setup lang="ts">
/**
 * OverlapPanel component
 * Jaccard similarity of the artists of every pair of issues, plus the
 * artists two chosen issues have in common. Pick a pair from the matrix or
 * from the two menus.
 */
import type { Playlist } from "@music/shared";
import { computed, ref } from "vue";

import { artistOverlapMatrix, sharedArtists } from "@/services/stats";
import { formatPercent } from "@/utils/format.ts";

import OverlapMatrix from "./OverlapMatrix.vue";

const props = defineProps<{
  /** Issues in matrix order. */
  issues: readonly Playlist[];
}>();

const matrix = computed(() => artistOverlapMatrix(props.issues));
const labels = computed(() =>
  props.issues.map((issue) =>
    issue.number === null ? "R" : String(issue.number),
  ),
);

/* Default to the most similar pair, so the panel opens on something interesting. */
const best = computed<[number, number]>(() => {
  let pair: [number, number] = [0, Math.min(1, props.issues.length - 1)];
  let highest = -1;
  matrix.value.values.forEach((row, i) =>
    row.forEach((value, j) => {
      if (j > i && value > highest) {
        highest = value;
        pair = [i, j];
      }
    }),
  );
  return pair;
});

const picked = ref<[number, number] | null>(null);
const pair = computed(() => picked.value ?? best.value);
const left = computed({
  get: () => pair.value[0],
  set: (value: number) => (picked.value = [value, pair.value[1]]),
});
const right = computed({
  get: () => pair.value[1],
  set: (value: number) => (picked.value = [pair.value[0], value]),
});

const a = computed(() => props.issues[left.value]);
const b = computed(() => props.issues[right.value]);
const shared = computed(() =>
  a.value && b.value ? sharedArtists(a.value, b.value) : [],
);
const similarity = computed(
  () => matrix.value.values[left.value]?.[right.value] ?? 0,
);
</script>

<template>
  <section class="glass panel" aria-labelledby="overlap-title">
    <h2 id="overlap-title" class="section-title">Sovrapposizione tra numeri</h2>
    <p class="muted intro">
      Similarità di Jaccard tra gli artisti di due numeri: artisti in comune
      diviso artisti totali. Più scuro, più simili.
    </p>
    <div class="layout">
      <OverlapMatrix
        :matrix="matrix"
        :labels="labels"
        :selected="pair"
        :cell="24"
        @select="(i, j) => (picked = [i, j])"
      />
      <div class="detail">
        <div class="pickers">
          <label>
            <span class="sr-only">Primo numero</span>
            <select id="overlap-a" v-model="left" class="chip">
              <option
                v-for="(issue, index) in issues"
                :key="issue.id"
                :value="index"
              >
                {{ issue.name }}
              </option>
            </select>
          </label>
          <span aria-hidden="true">×</span>
          <label>
            <span class="sr-only">Secondo numero</span>
            <select id="overlap-b" v-model="right" class="chip">
              <option
                v-for="(issue, index) in issues"
                :key="issue.id"
                :value="index"
              >
                {{ issue.name }}
              </option>
            </select>
          </label>
        </div>
        <p class="score tabular" aria-live="polite">
          {{ formatPercent(similarity) }}
          <span class="muted">· {{ shared.length }} artisti in comune</span>
        </p>
        <ul class="shared">
          <li v-for="artist in shared" :key="artist.id">
            <RouterLink
              :to="{ name: 'artist', params: { id: artist.id } }"
              class="chip"
              >{{ artist.name }}</RouterLink
            >
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.intro {
  margin: -6px 0 16px;
  font-size: 14px;
  max-inline-size: 65ch;
}
.layout {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 1000px) {
  .layout {
    grid-template-columns: minmax(0, auto) minmax(260px, 1fr);
    align-items: start;
  }
}
.detail {
  display: grid;
  gap: 12px;
  min-width: 0;
}
.pickers {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.pickers select {
  max-inline-size: 100%;
}
.score {
  margin: 0;
  font: 700 32px/1.1 var(--font-display);
}
.score span {
  font: 400 14px var(--font-body);
}
.shared {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
