<script setup lang="ts">
/**
 * ArtistView component
 * One artist across the series. A hero with picture and key figures, a
 * shelf of their albums, and a vertical timeline of appearances: each issue
 * as a large cover with its number, and under it the artist's tracks in
 * that issue, each with its own album cover.
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import SpotifyLink from "@/components/player/SpotifyLink.vue";
import CoverImage from "@/components/ui/CoverImage.vue";
import StatTile from "@/components/ui/StatTile.vue";
import { useAccent } from "@/composables/useAccent.ts";
import { useBackdrop } from "@/composables/useBackdrop.ts";
import { useCatalog } from "@/composables/useCatalog.ts";
import { recurringArtists } from "@/services/stats";
import { markerColor } from "@/utils/color.ts";
import {
  formatDate,
  formatIssue,
  formatLongDuration,
  formatTrackDuration,
} from "@/utils/format.ts";

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
 * Colour of an issue's dot on the rail: its liveliest cover colour.
 * @param playlist - The issue
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
              issues: t(
                "artist.issueCount",
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
        :value="formatIssue(first.number)"
        :detail="formatDate(first.firstAddedAt)"
      />
      <StatTile
        v-if="last"
        :label="t('artist.lastSeen')"
        :value="formatIssue(last.number)"
        :detail="formatDate(last.firstAddedAt)"
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
      <ul class="shelf">
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

    <section aria-labelledby="appearances-title" class="stack">
      <h2 id="appearances-title" class="section-title">
        {{ t("artist.appearances") }}
      </h2>
      <ol class="rail">
        <li
          v-for="(entry, index) in appearances"
          :key="entry.playlist.id"
          class="rail__item"
          :style="{
            '--i': Math.min(index, 10),
            '--dot': dotColor(entry.playlist),
          }"
        >
          <span class="rail__dot" aria-hidden="true" />
          <article class="issue glass">
            <RouterLink
              :to="{ name: 'playlist', params: { id: entry.playlist.id } }"
              class="issue__cover"
              :aria-label="entry.playlist.name"
            >
              <CoverImage
                :src="entry.playlist.coverUrl"
                :palette="entry.playlist.palette"
              />
            </RouterLink>
            <div class="issue__body">
              <header class="issue__head">
                <h3 class="issue__title">
                  <RouterLink
                    :to="{
                      name: 'playlist',
                      params: { id: entry.playlist.id },
                    }"
                    >{{ entry.playlist.name }}</RouterLink
                  >
                </h3>
                <p class="muted tabular">
                  {{ formatIssue(entry.playlist.number) }} ·
                  {{ formatDate(entry.playlist.firstAddedAt) }} ·
                  {{
                    t(
                      "common.tracks",
                      { n: entry.tracks.length },
                      entry.tracks.length,
                    )
                  }}
                </p>
              </header>
              <ul class="songs">
                <li v-for="track in entry.tracks" :key="track.id">
                  <a
                    :href="track.url"
                    target="_blank"
                    rel="noopener"
                    class="song"
                  >
                    <CoverImage
                      :src="track.album.imageUrl"
                      class="song__cover"
                    />
                    <span class="song__text">
                      <strong>{{ track.title }}</strong>
                      <span class="muted"
                        >{{ track.album.name }} ·
                        {{ formatTrackDuration(track.durationMs) }}</span
                      >
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </article>
        </li>
      </ol>
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
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
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
}
.shelf__name {
  font-weight: 650;
  font-size: 14px;
  line-height: 1.25;
}
.shelf__count {
  font-size: 12px;
}
.rail {
  list-style: none;
  margin: 0;
  padding: 0 0 0 28px;
  position: relative;
  display: grid;
  gap: 18px;
}
/* The rail: a vertical aurora line linking every appearance, newest at the top. */
.rail::before {
  content: "";
  position: absolute;
  inset: 8px auto 8px 8px;
  inline-size: 3px;
  border-radius: 3px;
  background: linear-gradient(var(--c1), var(--c2), var(--c3));
  box-shadow: 0 0 12px color-mix(in oklab, var(--c2) 50%, transparent);
}
.rail__item {
  position: relative;
  animation: rise-in 600ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--i) * 60ms);
}
@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}
/* Centred on the rail (x = 9.5px from the list edge) and on the card's middle. */
.rail__dot {
  position: absolute;
  inset: 50% auto auto -29.5px;
  inline-size: 22px;
  block-size: 22px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    color-mix(in oklab, var(--dot) 55%, #fff),
    var(--dot) 70%
  );
  box-shadow:
    0 0 0 5px color-mix(in oklab, var(--dot) 22%, transparent),
    0 0 18px var(--dot);
  transform: translateY(-50%);
  transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.rail__item:hover .rail__dot {
  transform: translateY(-50%) scale(1.2);
}
.issue {
  display: grid;
  gap: 14px 18px;
  padding: 14px;
  grid-template-columns: 88px minmax(0, 1fr);
}
@media (min-width: 720px) {
  .issue {
    grid-template-columns: 170px minmax(0, 1fr);
  }
}
.issue__cover {
  position: relative;
  display: block;
  max-inline-size: 170px;
  --cover-radius: 14px;
  filter: drop-shadow(
    0 16px 30px color-mix(in oklab, var(--dot) 45%, transparent)
  );
  transition: transform 250ms cubic-bezier(0.22, 1, 0.36, 1);
}
.issue__cover:hover {
  transform: scale(1.03);
}
.issue__body {
  display: grid;
  gap: 12px;
  align-content: start;
  min-width: 0;
}
.issue__head p {
  margin: 2px 0 0;
  font-size: 13px;
}
.issue__title {
  margin: 0;
  font-size: 20px;
  font-weight: 750;
}
.issue__title a {
  text-decoration: none;
}
.songs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
}
.song {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  border-radius: 12px;
  text-decoration: none;
  transition: background 150ms ease;
}
.song:hover {
  background: var(--glass);
}
.song__cover {
  --cover-radius: 8px;
  inline-size: 52px;
  flex: none;
}
.song__text {
  display: grid;
  min-width: 0;
  font-size: 14px;
}
.song__text strong,
.song__text span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.song__text span {
  font-size: 12px;
}
</style>
