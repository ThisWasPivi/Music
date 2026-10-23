<script setup lang="ts">
/**
 * PlaylistToolbar component
 * Fuzzy search, sort and filters of the showcase, bound to the browser
 * store.
 */
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import SelectMenu, { type SelectOption } from "@/components/ui/SelectMenu.vue";
import { useCatalog } from "@/composables/useCatalog.ts";
import { useBrowserStore } from "@/stores/browser.ts";
import { PLAYLIST_SORTS } from "@/strategies/playlists.ts";

const props = defineProps<{
  /** Decades present in the catalogue. */
  decades: readonly number[];

  /** Number of playlists after filtering. */
  resultCount: number;
}>();

const { t } = useI18n();
const store = useBrowserStore();
const { sortId, direction, query, artistId, decade, tag, activeFilterCount } =
  storeToRefs(store);
const { artists, tags, profile, playlists } = useCatalog();

/* How many issues each artist appears in, shown as a hint in the menu. */
const issueCounts = new Map<string, number>();
for (const playlist of playlists) {
  for (const id of new Set(
    playlist.tracks.flatMap((track) =>
      track.artists.map((artist) => artist.id),
    ),
  )) {
    issueCounts.set(id, (issueCounts.get(id) ?? 0) + 1);
  }
}

const artistOptions = computed<SelectOption<string>[]>(() => [
  { value: null, label: t("home.allArtists") },
  ...artists.map((artist) => ({
    value: artist.id,
    label: artist.name,
    hint: t(
      "home.issueCount",
      { n: issueCounts.get(artist.id) ?? 0 },
      issueCounts.get(artist.id) ?? 0,
    ),
    image: profile(artist.id)?.imageUrl ?? null,
    round: true,
  })),
]);

const decadeOptions = computed<SelectOption<number>[]>(() => [
  { value: null, label: t("home.anyDecade") },
  ...props.decades.map((value) => ({
    value,
    label: t("home.decade", { decade: value }),
  })),
]);
</script>

<template>
  <section class="toolbar glass panel" :aria-label="t('home.toolbar')">
    <label class="toolbar__search">
      <span class="sr-only">{{ t("home.searchLabel") }}</span>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle
          cx="7"
          cy="7"
          r="4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
        />
        <path
          d="m10.5 10.5 3 3"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
      <input
        id="playlist-search"
        v-model="query"
        class="field"
        type="search"
        :placeholder="t('home.searchPlaceholder')"
        autocomplete="off"
      />
    </label>

    <div class="toolbar__row">
      <span id="sort-label" class="toolbar__label muted">{{
        t("home.sortBy")
      }}</span>
      <div class="chips" role="group" aria-labelledby="sort-label">
        <button
          v-for="{ strategy } in PLAYLIST_SORTS"
          :key="strategy.id"
          type="button"
          class="chip"
          :aria-pressed="sortId === strategy.id"
          @click="store.setSort(strategy.id)"
        >
          {{ t(strategy.labelKey) }}
          <span v-if="sortId === strategy.id" aria-hidden="true">{{
            direction === "desc" ? "↓" : "↑"
          }}</span>
          <span v-if="sortId === strategy.id" class="sr-only">
            {{
              direction === "desc" ? t("sort.descending") : t("sort.ascending")
            }}
          </span>
        </button>
      </div>
    </div>

    <div class="toolbar__row">
      <span class="toolbar__label muted">{{ t("home.filterBy") }}</span>
      <div class="chips">
        <SelectMenu
          v-model="artistId"
          :options="artistOptions"
          :label="t('home.artist')"
        />
        <SelectMenu
          v-model="decade"
          :options="decadeOptions"
          :label="t('home.decadeLabel')"
          :searchable="false"
        />
        <button
          v-for="value in tags"
          :key="value"
          type="button"
          class="chip"
          :aria-pressed="tag === value"
          @click="tag = tag === value ? null : value"
        >
          #{{ value }}
        </button>
        <button
          v-if="activeFilterCount > 0"
          type="button"
          class="chip toolbar__reset"
          @click="store.resetFilters()"
        >
          {{ t("home.clearFilters") }}
        </button>
      </div>
    </div>
    <p class="muted toolbar__count" aria-live="polite">
      {{ t("home.resultCount", { n: resultCount }, resultCount) }}
    </p>
  </section>
</template>

<style scoped>
.toolbar {
  position: relative;
  z-index: 5;
  display: grid;
  gap: 14px;
}
.toolbar__search {
  position: relative;
}
.toolbar__search svg {
  position: absolute;
  inset: 50% auto auto 18px;
  inline-size: 16px;
  block-size: 16px;
  transform: translateY(-50%);
  color: var(--muted);
}
.toolbar__search .field {
  padding-left: 44px;
}
.toolbar__row {
  display: grid;
  grid-template-columns: 5.5em minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}
.toolbar__label {
  padding-top: 9px;
  font-size: 13px;
}
.toolbar__reset {
  border-style: dashed;
}
.toolbar__count {
  margin: 0;
  font-size: 13px;
}
@media (max-width: 600px) {
  .toolbar__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
  .toolbar__label {
    padding-top: 0;
  }
}
</style>
