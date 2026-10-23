<script setup lang="ts">
/**
 * PlaylistCard component
 * One issue in the showcase grid: cover with its own colour glow, name,
 * number, track count and duration.
 */
import type { Playlist } from "@music/shared";
import { useI18n } from "vue-i18n";

import CoverImage from "@/components/ui/CoverImage.vue";
import { markerColor } from "@/utils/color.ts";
import { formatIssue, formatLongDuration } from "@/utils/format.ts";

defineProps<{
  /** The issue to show. */
  playlist: Playlist;
}>();

const { t } = useI18n();
</script>

<template>
  <article
    class="card glass"
    :style="{ '--card': markerColor(playlist.palette, 0.5) }"
  >
    <CoverImage
      :src="playlist.coverUrl"
      :palette="playlist.palette"
      class="card__cover"
    />
    <div class="card__body">
      <p class="card__issue tabular">{{ formatIssue(playlist.number) }}</p>
      <h3 class="card__title">
        <RouterLink
          :to="{ name: 'playlist', params: { id: playlist.id } }"
          class="card__link"
        >
          {{ playlist.name }}
        </RouterLink>
      </h3>
      <p class="card__meta muted tabular">
        {{
          t("common.tracks", { n: playlist.trackCount }, playlist.trackCount)
        }}
        ·
        {{ formatLongDuration(playlist.durationMs) }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: grid;
  gap: 12px;
  padding: 12px;
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 220ms ease;
}
.card:hover,
.card:focus-within {
  transform: translateY(-4px);
  box-shadow: 0 22px 50px -22px var(--card);
}
.card__cover {
  box-shadow: 0 16px 40px -18px var(--card);
}
.card__body {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.card__issue {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}
.card__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}
.card__link {
  text-decoration: none;
}
/* The whole card is the hit area, while only the title is announced as a link. */
.card__link::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
}
.card__link:focus-visible {
  outline: none;
}
.card:has(.card__link:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}
.card__meta {
  margin: 0;
  font-size: 13px;
}
@media (prefers-reduced-motion: reduce) {
  .card:hover,
  .card:focus-within {
    transform: none;
  }
}
</style>
