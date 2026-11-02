<script setup lang="ts">
/**
 * YearView component
 * One year of the series at a glance: how many playlists and tracks, the
 * playlists themselves, the most featured artists and albums, the artists
 * who showed up for the first time and the days tracks were added. Other
 * years are one tap away in the year strip at the top.
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import HeatmapCalendar from "@/components/stats/HeatmapCalendar.vue";
import TopRankings from "@/components/stats/TopRankings.vue";
import CoverImage from "@/components/ui/CoverImage.vue";
import SectionTitle from "@/components/ui/SectionTitle.vue";
import StatTile from "@/components/ui/StatTile.vue";
import { useCatalog } from "@/composables/useCatalog.ts";
import {
  buildAddedHeatmap,
  releaseYears,
  reviewYear,
  summarize,
} from "@/services/stats";
import { formatLongDuration } from "@/utils/format.ts";
import { playlistTooltip } from "@/utils/tooltips.ts";

import NotFoundView from "./NotFoundView.vue";

const props = defineProps<{
  /** The year, from the route. */
  year: string;
}>();

const { t, locale } = useI18n();
const { playlists, profile } = useCatalog();
const years = releaseYears(playlists);

const review = computed(() => reviewYear(playlists, Number(props.year)));
const summary = computed(() => summarize(review.value.tracks));
const heatmap = computed(() => {
  const full = buildAddedHeatmap(review.value.tracks);
  /* Only this year's calendar: tracks of its playlists added later are left out. */
  const own = full.years.filter((entry) => entry.year === review.value.year);
  return { ...full, years: own };
});

/** Month with the most releases, as a name in the interface language. */
const busiestMonth = computed(() => {
  const busiest = review.value.busiestMonth;
  if (!busiest) return null;
  return new Intl.DateTimeFormat(locale.value, {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, busiest.month, 1)));
});

/** "+3 on the year before", or nothing for the first year. */
const comparison = computed(() => {
  const previous = review.value.previousCount;
  if (previous === null) return undefined;
  const delta = review.value.playlists.length - previous;
  if (delta === 0) return t("years.sameAsBefore");
  return t(
    delta > 0 ? "years.moreThanBefore" : "years.fewerThanBefore",
    { n: Math.abs(delta) },
    Math.abs(delta),
  );
});
</script>

<template>
  <NotFoundView v-if="review.playlists.length === 0" />
  <div v-else class="stack">
    <header class="head">
      <p class="eyebrow">{{ t("years.eyebrow") }}</p>
      <h1 class="page-title tabular">
        <span class="grad">{{ review.year }}</span>
      </h1>
      <nav class="years" :aria-label="t('years.pick')">
        <RouterLink
          v-for="entry in years"
          :key="entry"
          :to="{ name: 'year', params: { year: String(entry) } }"
          class="chip tabular"
          :aria-current="entry === review.year ? 'page' : undefined"
        >
          {{ entry }}
        </RouterLink>
      </nav>
    </header>

    <div class="tiles">
      <StatTile
        :key="`p-${review.year}`"
        :label="t('years.playlists')"
        :value="String(review.playlists.length)"
        :detail="comparison"
      />
      <StatTile
        :key="`t-${review.year}`"
        :label="t('stats.tracks')"
        :value="String(summary.trackCount)"
        :detail="t('stats.unique', { n: summary.uniqueTrackCount })"
      />
      <StatTile
        :key="`l-${review.year}`"
        :label="t('stats.listening')"
        :value="formatLongDuration(summary.totalMs)"
      />
      <StatTile
        :key="`n-${review.year}`"
        :label="t('years.newArtists')"
        :value="String(review.newArtists.length)"
        :detail="t('years.ofArtists', { n: summary.uniqueArtistCount })"
      />
      <StatTile
        v-if="busiestMonth && review.busiestMonth"
        :key="`m-${review.year}`"
        :label="t('years.busiestMonth')"
        :value="busiestMonth"
        :detail="
          t(
            'common.playlistCount',
            { n: review.busiestMonth.count },
            review.busiestMonth.count,
          )
        "
      />
    </div>

    <section class="glass panel" aria-labelledby="year-playlists">
      <SectionTitle
        id="year-playlists"
        :title="t('years.playlistsTitle')"
        :info="t('years.playlistsInfo')"
      />
      <ol class="covers">
        <li
          v-for="(playlist, index) in review.playlists"
          :key="playlist.id"
          :style="{ '--i': Math.min(index, 20) }"
        >
          <RouterLink
            v-tooltip="playlistTooltip(playlist)"
            :to="{ name: 'playlist', params: { id: playlist.id } }"
            :aria-label="playlist.name"
            class="covers__link"
          >
            <CoverImage :src="playlist.coverUrl" :palette="playlist.palette" />
            <span
              v-if="playlist === review.longest || playlist === review.shortest"
              class="covers__badge"
            >
              {{
                playlist === review.longest
                  ? t("years.longest")
                  : t("years.shortest")
              }}
            </span>
          </RouterLink>
        </li>
      </ol>
    </section>

    <div class="grid-2">
      <TopRankings
        :key="`a-${review.year}`"
        :tracks="review.tracks"
        kind="artists"
      />
      <TopRankings
        :key="`b-${review.year}`"
        :tracks="review.tracks"
        kind="albums"
      />
    </div>

    <section
      v-if="review.newArtists.length > 0"
      class="glass panel"
      aria-labelledby="year-new"
    >
      <SectionTitle
        id="year-new"
        :title="t('years.newArtistsTitle')"
        :info="t('years.newArtistsInfo')"
      />
      <ul class="faces">
        <li v-for="artist in review.newArtists.slice(0, 24)" :key="artist.id">
          <RouterLink
            :to="{ name: 'artist', params: { id: artist.id } }"
            class="faces__link"
          >
            <CoverImage
              :src="profile(artist.id)?.imageUrl ?? null"
              :name="artist.name"
              class="faces__picture"
            />
            <span class="faces__name">{{ artist.name }}</span>
          </RouterLink>
        </li>
      </ul>
      <p v-if="review.newArtists.length > 24" class="muted more">
        {{ t("years.andMore", { n: review.newArtists.length - 24 }) }}
      </p>
    </section>

    <section class="glass panel" aria-labelledby="year-added">
      <SectionTitle
        id="year-added"
        :title="t('stats.addedTitle')"
        :info="t('stats.addedLede')"
      />
      <HeatmapCalendar :key="`h-${review.year}`" :heatmap="heatmap" />
    </section>
  </div>
</template>

<style scoped>
.head {
  display: grid;
  gap: 10px;
}
.head .page-title {
  font-size: clamp(56px, 10vw, 112px);
}
.years {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.years .chip[aria-current="page"] {
  background: var(--text);
  color: var(--bg);
  border-color: var(--text);
}
.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
/* Tiles share each row and the last row stretches, so no tile is left alone. */
.tiles > * {
  flex: 1 1 130px;
}
.covers {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(min(120px, 28vw), 1fr));
}
.covers li {
  animation: cover-in 520ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  animation-delay: calc(var(--i) * 40ms);
}
@keyframes cover-in {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
}
.covers__link {
  position: relative;
  display: block;
  border-radius: 14px;
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.covers__link:hover {
  transform: translateY(-3px) rotate(-1.5deg);
}
.covers__badge {
  position: absolute;
  inset: 8px auto auto 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--glass-pop);
  backdrop-filter: blur(10px);
  color: var(--text);
  font-size: 11px;
  font-weight: 700;
}
.faces {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px 10px;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
}
.faces__link {
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
  text-decoration: none;
  font-size: 13px;
  transition: color 160ms ease;
}
.faces__link:hover {
  color: var(--accent);
}
.faces__picture {
  inline-size: 68px;
  --cover-radius: 50%;
}
.faces__link:hover .faces__picture {
  transform: scale(1.08);
  box-shadow: 0 10px 24px -10px var(--accent);
}
.faces__name {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.more {
  margin: 14px 0 0;
  font-size: 14px;
}
</style>
