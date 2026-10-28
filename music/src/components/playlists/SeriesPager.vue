<script setup lang="ts">
/**
 * SeriesPager component
 * Links to the previous and next playlist of the series, with their covers.
 */
import type { Playlist } from "@music/shared";
import { useI18n } from "vue-i18n";

import CoverImage from "@/components/ui/CoverImage.vue";

defineProps<{
  /** The playlist before, if any. */
  previous?: Playlist;

  /** The playlist after, if any. */
  next?: Playlist;
}>();

const { t } = useI18n();
</script>

<template>
  <nav class="pager" :aria-label="t('playlist.neighbours')">
    <RouterLink
      v-if="previous"
      :to="{ name: 'playlist', params: { id: previous.id } }"
      class="pager__item glass"
      rel="prev"
    >
      <CoverImage
        :src="previous.coverUrl"
        :palette="previous.palette"
        class="pager__cover"
      />
      <span class="pager__text">
        <span class="muted">← {{ t("playlist.previous") }}</span>
        <strong>{{ previous.name }}</strong>
      </span>
    </RouterLink>
    <span v-else class="pager__item pager__item--off glass">
      <span class="pager__text"
        ><span class="muted">← {{ t("playlist.previous") }}</span
        ><strong>{{ t("playlist.first") }}</strong></span
      >
    </span>
    <RouterLink
      v-if="next"
      :to="{ name: 'playlist', params: { id: next.id } }"
      class="pager__item pager__item--next glass"
      rel="next"
    >
      <span class="pager__text">
        <span class="muted">{{ t("playlist.next") }} →</span>
        <strong>{{ next.name }}</strong>
      </span>
      <CoverImage
        :src="next.coverUrl"
        :palette="next.palette"
        class="pager__cover"
      />
    </RouterLink>
    <span v-else class="pager__item pager__item--next pager__item--off glass">
      <span class="pager__text"
        ><span class="muted">{{ t("playlist.next") }} →</span
        ><strong>{{ t("playlist.notYet") }}</strong></span
      >
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
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  text-decoration: none;
  font-size: 13px;
  min-width: 0;
  transition: background 150ms ease;
}
.pager__item--next {
  justify-content: flex-end;
  text-align: right;
}
.pager__cover {
  flex: none;
  inline-size: 44px;
  --cover-radius: 8px;
}
.pager__text {
  display: grid;
  min-width: 0;
}
.pager__text strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pager__item--off {
  opacity: 0.6;
}
a.pager__item:hover {
  background: var(--glass-strong);
}
a.pager__item:hover .pager__cover {
  transform: scale(1.08);
}
a.pager__item:hover strong {
  color: var(--accent);
}
</style>
