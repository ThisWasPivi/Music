<script setup lang="ts">
/**
 * SeriesPager component
 * Links to the previous and next issue of the series.
 */
import type { Playlist } from "@music/shared";

defineProps<{
  /** The issue before, if any. */
  previous?: Playlist;

  /** The issue after, if any. */
  next?: Playlist;
}>();
</script>

<template>
  <nav class="pager" aria-label="Numeri vicini nella serie">
    <RouterLink
      v-if="previous"
      :to="{ name: 'playlist', params: { id: previous.id } }"
      class="pager__item glass"
      rel="prev"
    >
      <span class="muted">← Precedente</span>
      <strong>{{ previous.name }}</strong>
    </RouterLink>
    <span v-else class="pager__item pager__item--off glass"
      ><span class="muted">← Precedente</span><strong>È il primo</strong></span
    >
    <RouterLink
      v-if="next"
      :to="{ name: 'playlist', params: { id: next.id } }"
      class="pager__item pager__item--next glass"
      rel="next"
    >
      <span class="muted">Successivo →</span>
      <strong>{{ next.name }}</strong>
    </RouterLink>
    <span v-else class="pager__item pager__item--next pager__item--off glass">
      <span class="muted">Successivo →</span><strong>Non ancora uscito</strong>
    </span>
  </nav>
</template>

<style scoped>
.pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.pager__item {
  display: grid;
  gap: 2px;
  padding: 14px 16px;
  text-decoration: none;
  font-size: 14px;
  min-width: 0;
}
.pager__item strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pager__item--next {
  text-align: right;
}
.pager__item--off {
  opacity: 0.6;
}
a.pager__item:hover {
  background: var(--glass-strong);
}
</style>
