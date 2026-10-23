<script setup lang="ts">
/**
 * PlaylistView component
 * One issue: header with cover and facts, the Spotify player, the tracklist
 * with album covers, and links to the neighbouring issues. The cover,
 * blurred, fills the whole page behind it.
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import SpotifyEmbed from "@/components/player/SpotifyEmbed.vue";
import SpotifyLink from "@/components/player/SpotifyLink.vue";
import SeriesPager from "@/components/playlists/SeriesPager.vue";
import TrackTable from "@/components/playlists/TrackTable.vue";
import CoverImage from "@/components/ui/CoverImage.vue";
import IssueTitle from "@/components/ui/IssueTitle.vue";
import { useAccent } from "@/composables/useAccent.ts";
import { useBackdrop } from "@/composables/useBackdrop.ts";
import { useCatalog } from "@/composables/useCatalog.ts";
import { summarize } from "@/services/stats";
import {
  formatDate,
  formatIssue,
  formatLongDuration,
  formatPercent,
  formatTrackDuration,
} from "@/utils/format.ts";

import NotFoundView from "./NotFoundView.vue";

const props = defineProps<{
  /** Spotify id of the playlist, from the route. */
  id: string;
}>();

const { t } = useI18n();
const catalog = useCatalog();
const playlist = computed(() => catalog.byId(props.id));
const neighbours = computed(() =>
  playlist.value ? catalog.neighbours(playlist.value) : {},
);
const summary = computed(() => summarize(playlist.value?.tracks ?? []));
useAccent(() => playlist.value?.palette);
useBackdrop(() => playlist.value?.coverUrl);
</script>

<template>
  <NotFoundView v-if="!playlist" />
  <div v-else class="stack">
    <section class="head glass" aria-labelledby="playlist-title">
      <a
        :href="playlist.url"
        target="_blank"
        rel="noopener"
        class="head__cover"
        :aria-label="t('playlist.openCover', { name: playlist.name })"
      >
        <CoverImage
          :src="playlist.coverUrl"
          :palette="playlist.palette"
          eager
        />
      </a>
      <div class="head__body">
        <p class="eyebrow">Pivəəkly · {{ formatIssue(playlist.number) }}</p>
        <h1 id="playlist-title" class="page-title head__title">
          <IssueTitle :name="playlist.name" />
        </h1>
        <p v-if="playlist.description" class="head__text muted">
          {{ playlist.description }}
        </p>
        <dl class="facts">
          <div>
            <dt>
              <span
                v-tooltip="t('playlist.releaseNote')"
                tabindex="0"
                class="facts__hint"
                >{{ t("playlist.released") }}<sup>*</sup></span
              >
            </dt>
            <dd>{{ formatDate(playlist.firstAddedAt) }}</dd>
          </div>
          <div>
            <dt>{{ t("playlist.updated") }}</dt>
            <dd>{{ formatDate(playlist.lastAddedAt) }}</dd>
          </div>
          <div>
            <dt>{{ t("playlist.tracks") }}</dt>
            <dd>{{ playlist.trackCount }}</dd>
          </div>
          <div>
            <dt>{{ t("playlist.duration") }}</dt>
            <dd>{{ formatLongDuration(playlist.durationMs) }}</dd>
          </div>
          <div>
            <dt>{{ t("playlist.average") }}</dt>
            <dd>{{ formatTrackDuration(summary.averageMs) }}</dd>
          </div>
          <div>
            <dt>{{ t("playlist.explicit") }}</dt>
            <dd>{{ formatPercent(summary.explicitShare) }}</dd>
          </div>
        </dl>
        <div v-if="playlist.tags.length > 0" class="chips">
          <span v-for="tag in playlist.tags" :key="tag" class="chip"
            >#{{ tag }}</span
          >
        </div>
        <SpotifyLink :href="playlist.url" :label="t('common.openOnSpotify')" />
      </div>
    </section>

    <div class="body">
      <TrackTable :tracks="playlist.tracks" />
      <aside class="aside" :aria-label="t('playlist.listen')">
        <SpotifyEmbed :playlist="playlist" />
        <SeriesPager :previous="neighbours.previous" :next="neighbours.next" />
        <p class="muted note"><sup>*</sup> {{ t("playlist.releaseNote") }}</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.head {
  display: grid;
  gap: 24px;
  align-items: center;
  padding: clamp(16px, 2.6vw, 28px);
}
@media (min-width: 760px) {
  .head {
    grid-template-columns: minmax(200px, 280px) minmax(0, 1fr);
  }
}
.head__cover {
  display: block;
  max-inline-size: 280px;
  --cover-radius: 18px;
  filter: drop-shadow(
    0 30px 60px color-mix(in oklab, var(--c1) 50%, transparent)
  );
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.head__cover:hover {
  transform: scale(1.02) rotate(-0.6deg);
}
.head__body {
  display: grid;
  gap: 14px;
  justify-items: start;
  min-width: 0;
}
.head__title {
  font-size: clamp(40px, 7vw, 84px);
}
.head__text {
  margin: 0;
  max-inline-size: 65ch;
}
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin: 0;
}
.facts dt {
  font-size: 12px;
  color: var(--muted);
}
.facts__hint {
  cursor: help;
  border-radius: 4px;
}
.facts dd {
  margin: 0;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.body {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 1040px) {
  .body {
    grid-template-columns: minmax(0, 1fr) 340px;
    align-items: start;
  }
  .aside {
    position: sticky;
    top: 90px;
  }
}
.aside {
  display: grid;
  gap: 14px;
}
.note {
  margin: 0;
  font-size: 12px;
}
</style>
