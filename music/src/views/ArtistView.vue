<script setup lang="ts">
/**
 * ArtistView component
 * One artist across the series. A hero with picture and key figures, a
 * shelf of their albums, a map of every playlist of the series by cover,
 * with the ones featuring the artist lit up and the others faded, and
 * their appearances grouped by year with the artist's tracks in each.
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import SpotifyLink from "@/components/player/SpotifyLink.vue";
import CoverImage from "@/components/ui/CoverImage.vue";
import SectionTitle from "@/components/ui/SectionTitle.vue";
import StatTile from "@/components/ui/StatTile.vue";
import { useAccent } from "@/composables/useAccent.ts";
import { useBackdrop } from "@/composables/useBackdrop.ts";
import { useCatalog } from "@/composables/useCatalog.ts";
import type { TooltipContent } from "@/composables/useTooltip.ts";
import { recurringArtists } from "@/services/stats";
import { markerColor } from "@/utils/color.ts";
import {
  formatDate,
  formatLongDuration,
  formatTrackDuration,
} from "@/utils/format.ts";
import { playlistTooltip } from "@/utils/tooltips.ts";

import NotFoundView from "./NotFoundView.vue";

const props = defineProps<{
  /** Spotify artist id, from the route. */
  id: string;
}>();

const { t } = useI18n();
const catalog = useCatalog();
const artist = computed(() =>
  catalog.artists.find((entry) => entry.id === props.id),
);
const profile = computed(() => catalog.profile(props.id));

/** Issues featuring the artist, newest first, with the artist's tracks in each. */
const appearances = computed(() =>
  catalog.playlists
    .map((playlist) => ({
      playlist,
      tracks: playlist.tracks.filter((track) =>
        track.artists.some((credit) => credit.id === props.id),
      ),
    }))
    .filter((entry) => entry.tracks.length > 0),
);
const tracks = computed(() =>
  appearances.value.flatMap((entry) => entry.tracks),
);
const totalMs = computed(() =>
  tracks.value.reduce((sum, track) => sum + track.durationMs, 0),
);
const stats = computed(() =>
  recurringArtists(catalog.playlists).find((row) => row.artist.id === props.id),
);
const first = computed(() => appearances.value.at(-1)?.playlist);
const last = computed(() => appearances.value[0]?.playlist);

/** Distinct albums of the artist's tracks, most featured first. */
const albums = computed(() => {
  const rows = new Map<
    string,
    { album: (typeof tracks.value)[number]["album"]; count: number }
  >();
  for (const track of tracks.value) {
    const row = rows.get(track.album.id) ?? { album: track.album, count: 0 };
    row.count += 1;
    rows.set(track.album.id, row);
  }
  return [...rows.values()].sort(
    (a, b) =>
      b.count - a.count || a.album.name.localeCompare(b.album.name, "en"),
  );
});

/**
 * One square of the presence map.
 * @property playlist - The playlist
 * @property count - The artist's tracks in it, 0 when absent
 * @property tooltip - Cover, name and the artist's track count
 * @property label - Accessible name
 */
interface PresenceCell {
  playlist: (typeof catalog.playlists)[number];
  count: number;
  tooltip: TooltipContent;
  label: string;
}

/** Every playlist in series order, with the artist's tracks in each. */
const presence = computed<PresenceCell[]>(() => {
  const counts = new Map(
    appearances.value.map((entry) => [entry.playlist.id, entry.tracks.length]),
  );
  return catalog.issues.map((playlist) => {
    const count = counts.get(playlist.id) ?? 0;
    const detail =
      count > 0
        ? t("artist.tracksHere", { n: count }, count)
        : t("artist.absent");
    return {
      playlist,
      count,
      tooltip: playlistTooltip(playlist, detail),
      label: `${playlist.name}: ${detail}`,
    };
  });
});
const presentCount = computed(
  () => presence.value.filter((cell) => cell.count > 0).length,
);

/** Appearances grouped by year, newest first. */
const byYear = computed(() => {
  const groups = new Map<string, typeof appearances.value>();
  for (const entry of appearances.value) {
    const year = entry.playlist.firstAddedAt?.slice(0, 4) ?? "—";
    groups.set(year, [...(groups.get(year) ?? []), entry]);
  }
  return [...groups.entries()].map(([year, entries]) => ({ year, entries }));
});

/**
 * Colour of an issue in the artist's lists: its liveliest cover colour.
 * @param playlist - The playlist
 * @returns A vivid colour
 */
function dotColor(playlist: (typeof catalog.playlists)[number]): string {
  const index = catalog.issues.indexOf(playlist);
  return markerColor(
    playlist.palette,
    index < 0 ? 1 : index / Math.max(1, catalog.issues.length - 1),
  );
}

useAccent(() => last.value?.palette);
useBackdrop(() => profile.value?.imageUrl ?? last.value?.coverUrl);
</script>

<template>
  <NotFoundView v-if="!artist" />
  <div v-else class="stack">
    <section class="hero glass" aria-labelledby="artist-title">
      <div class="hero__picture">
        <CoverImage v-if="profile?.imageUrl" :src="profile.imageUrl" eager />
        <span v-else class="hero__initial" aria-hidden="true">{{
          artist.name.charAt(0)
        }}</span>
      </div>
      <div class="hero__body">
        <p class="eyebrow">{{ t("artist.eyebrow") }}</p>
        <h1 id="artist-title" class="page-title">{{ artist.name }}</h1>
        <p class="hero__lede muted">
          {{
            t("artist.lede", {
              playlists: t(
                "common.playlistCount",
                { n: appearances.length },
                appearances.length,
              ),
              tracks: t("common.tracks", { n: tracks.length }, tracks.length),
            })
          }}
        </p>
        <SpotifyLink :href="artist.url" :label="t('common.openOnSpotify')" />
      </div>
    </section>

    <div class="tiles">
      <StatTile
        :label="t('artist.issues')"
        :value="String(appearances.length)"
      />
      <StatTile :label="t('artist.tracks')" :value="String(tracks.length)" />
      <StatTile
        :label="t('artist.listening')"
        :value="formatLongDuration(totalMs)"
      />
      <StatTile
        v-if="first"
        :label="t('artist.firstSeen')"
        :value="formatDate(first.firstAddedAt)"
        :detail="first.name"
      />
      <StatTile
        v-if="last"
        :label="t('artist.lastSeen')"
        :value="formatDate(last.firstAddedAt)"
        :detail="last.name"
      />
      <StatTile
        v-if="stats"
        :label="t('artist.streak')"
        :value="String(stats.longestStreak)"
        :detail="t('artist.streakDetail')"
      />
    </div>

    <section
      v-if="albums.length > 0"
      class="glass panel"
      aria-labelledby="albums-title"
    >
      <h2 id="albums-title" class="section-title">{{ t("artist.albums") }}</h2>
      <ul v-drag-scroll class="shelf">
        <li v-for="row in albums" :key="row.album.id">
          <a
            :href="row.album.url"
            target="_blank"
            rel="noopener"
            class="shelf__album"
          >
            <CoverImage :src="row.album.imageUrl" class="shelf__cover" />
            <span class="shelf__name">{{ row.album.name }}</span>
            <span class="muted shelf__count">{{
              t("common.tracks", { n: row.count }, row.count)
            }}</span>
          </a>
        </li>
      </ul>
    </section>

    <section
      v-if="presence.length > 0"
      class="glass panel"
      aria-labelledby="presence-title"
    >
      <SectionTitle
        id="presence-title"
        :title="t('artist.presence')"
        :info="t('artist.presenceInfo')"
      />
      <p class="presence__summary muted">
        {{
          t("artist.presenceSummary", {
            n: presentCount,
            total: presence.length,
          })
        }}
      </p>
      <ol class="presence">
        <li
          v-for="(cell, index) in presence"
          :key="cell.playlist.id"
          :style="{ '--i': index }"
        >
          <RouterLink
            v-tooltip="cell.tooltip"
            :to="{ name: 'playlist', params: { id: cell.playlist.id } }"
            class="presence__cell"
            :class="{ 'presence__cell--on': cell.count > 0 }"
            :style="{ '--dot': dotColor(cell.playlist) }"
            :aria-label="cell.label"
          >
            <CoverImage
              :src="cell.playlist.coverUrl"
              :palette="cell.playlist.palette"
              class="presence__cover"
            />
          </RouterLink>
        </li>
      </ol>
    </section>

    <section aria-labelledby="appearances-title" class="stack">
      <h2 id="appearances-title" class="section-title">
        {{ t("artist.appearances") }}
      </h2>
      <section
        v-for="group in byYear"
        :key="group.year"
        class="year"
        :aria-label="group.year"
      >
        <h3 class="year__title tabular">{{ group.year }}</h3>
        <ul class="appearances">
          <li
            v-for="(entry, index) in group.entries"
            :key="entry.playlist.id"
            class="appearance glass"
            :style="{
              '--i': Math.min(index, 10),
              '--dot': dotColor(entry.playlist),
            }"
          >
            <RouterLink
              :to="{ name: 'playlist', params: { id: entry.playlist.id } }"
              class="appearance__head"
            >
              <CoverImage
                :src="entry.playlist.coverUrl"
                :palette="entry.playlist.palette"
                class="appearance__cover"
              />
              <span class="appearance__text">
                <strong class="appearance__name">{{
                  entry.playlist.name
                }}</strong>
                <span class="muted tabular">
                  {{ formatDate(entry.playlist.firstAddedAt) }}
                </span>
              </span>
              <span class="appearance__count tabular">
                {{
                  t(
                    "common.tracks",
                    { n: entry.tracks.length },
                    entry.tracks.length,
                  )
                }}
              </span>
            </RouterLink>
            <ul class="songs">
              <li v-for="track in entry.tracks" :key="track.id">
                <a
                  :href="track.url"
                  target="_blank"
                  rel="noopener"
                  class="song"
                >
                  <CoverImage :src="track.album.imageUrl" class="song__cover" />
                  <span class="song__text">
                    <strong>{{ track.title }}</strong>
                    <span class="muted">{{ track.album.name }}</span>
                  </span>
                  <span class="song__time muted tabular">{{
                    formatTrackDuration(track.durationMs)
                  }}</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </section>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
  padding: clamp(18px, 3vw, 32px);
}
.hero__picture {
  flex: none;
  inline-size: clamp(130px, 22vw, 210px);
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  --cover-radius: 50%;
  box-shadow:
    0 0 0 4px var(--glass-border),
    0 30px 70px -24px var(--c1);
  background: linear-gradient(135deg, var(--c1), var(--c2));
}
.hero__initial {
  display: grid;
  place-items: center;
  block-size: 100%;
  font: 800 clamp(48px, 9vw, 96px) var(--font-display);
  color: #fff;
}
.hero__body {
  display: grid;
  gap: 12px;
  justify-items: start;
  flex: 1 1 280px;
  min-width: 0;
}
.hero__lede {
  margin: 0;
  font-size: 16px;
}
.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
/* Tiles share each row and the last row stretches, so no tile is left alone. */
.tiles > * {
  flex: 1 1 150px;
}
.shelf {
  list-style: none;
  margin: 0;
  padding: 0 0 6px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(130px, 150px);
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}
.shelf li {
  scroll-snap-align: start;
}
.shelf__album {
  display: grid;
  gap: 6px;
  text-decoration: none;
}
.shelf__cover {
  --cover-radius: 12px;
  box-shadow: 0 14px 30px -18px rgb(0 0 0 / 0.6);
  transition: transform 250ms cubic-bezier(0.22, 1, 0.36, 1);
}
.shelf__album:hover .shelf__cover {
  transform: translateY(-4px) rotate(-1.5deg);
  box-shadow: 0 20px 34px -18px var(--accent);
}
.shelf__name {
  transition: color 160ms ease;
}
.shelf__album:hover .shelf__name {
  color: var(--accent);
}
.shelf__name {
  font-weight: 650;
  font-size: 14px;
  line-height: 1.25;
}
.shelf__count {
  font-size: 12px;
}
.presence__summary {
  margin: -6px 0 14px;
  font-size: 14px;
}
/* One square per issue in series order: lit with the cover where the artist appears. */
.presence {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
  gap: 6px;
}
@media (min-width: 720px) {
  .presence {
    grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
    gap: 8px;
  }
}
.presence li {
  animation: presence-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  animation-delay: calc(var(--i) * 18ms);
}
@keyframes presence-in {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}
.presence__cell {
  position: relative;
  display: block;
  aspect-ratio: 1;
  border-radius: 10px;
  transition:
    transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 200ms ease,
    opacity 200ms ease;
}
.presence__cover {
  position: absolute;
  inset: 0;
  --cover-radius: 10px;
}
/* Playlists without the artist: a faded, greyed cover. */
.presence__cell:not(.presence__cell--on) {
  opacity: 0.28;
  filter: grayscale(1);
}
.presence__cell:not(.presence__cell--on):hover {
  opacity: 0.7;
  filter: none;
}
.presence__cell--on {
  box-shadow:
    0 0 0 2px var(--dot),
    0 6px 16px -6px var(--dot);
}
.presence__cell:hover {
  transform: scale(1.15);
  z-index: 1;
}
.presence__cell--on:hover {
  box-shadow:
    0 0 0 2px var(--dot),
    0 10px 24px -6px var(--dot);
}
.year {
  display: grid;
  gap: 12px;
}
.year__title {
  margin: 0;
  font: 750 15px var(--font-display);
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 12px;
}
.year__title::after {
  content: "";
  flex: 1;
  block-size: 1px;
  background: var(--line);
}
.appearances {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  align-items: start;
}
.appearance {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 20px;
  animation: rise-in 600ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--i) * 50ms);
}
@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}
.appearance__head {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 4px;
  margin: -4px;
  border-radius: 14px;
  text-decoration: none;
  transition: background 160ms ease;
}
.appearance__head:hover {
  background: var(--glass-strong);
}
.appearance__cover {
  --cover-radius: 12px;
  box-shadow: 0 10px 24px -12px var(--dot);
}
.appearance__head:hover .appearance__cover {
  transform: scale(1.05) rotate(-2deg);
}
.appearance__text {
  display: grid;
  min-width: 0;
  font-size: 13px;
}
.appearance__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 700 16px var(--font-display);
  transition: color 160ms ease;
}
.appearance__head:hover .appearance__name {
  color: var(--accent);
}
.appearance__count {
  padding: 2px 9px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--dot) 22%, transparent);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.songs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
}
.song {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 5px 6px;
  border-radius: 10px;
  text-decoration: none;
  transition: background 150ms ease;
}
.song:hover {
  background: var(--glass-strong);
}
.song:hover .song__cover {
  transform: scale(1.08) rotate(-2deg);
}
.song:hover strong {
  color: var(--accent);
}
.song__cover {
  --cover-radius: 7px;
}
.song__text {
  display: grid;
  min-width: 0;
  font-size: 13px;
  line-height: 1.3;
}
.song__text > * {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.song__text strong {
  font-size: 14px;
  transition: color 160ms ease;
}
.song__time {
  font-size: 12px;
}
</style>
