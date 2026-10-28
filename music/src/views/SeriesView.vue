<script setup lang="ts">
/**
 * SeriesView component
 * The series over time: real-time release timeline, gaps between issues,
 * new artists per issue, recurring artists and repeated tracks.
 */
import { findMissingIssues } from "@music/shared";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ReleaseTimeline from "@/components/series/ReleaseTimeline.vue";
import ColumnChart, { type Column } from "@/components/stats/ColumnChart.vue";
import CoverImage from "@/components/ui/CoverImage.vue";
import StatTile from "@/components/ui/StatTile.vue";
import { useCatalog } from "@/composables/useCatalog.ts";
import {
  discoveryByIssue,
  recurringArtists,
  releaseTimeline,
  repeatedTracks,
} from "@/services/stats";
import { formatDate, formatIssue, formatPercent } from "@/utils/format.ts";

const { t } = useI18n();
const { playlists, issues, latest, profile } = useCatalog();

const timeline = releaseTimeline(issues);
const missing = findMissingIssues(
  issues.flatMap((issue) => (issue.number === null ? [] : [issue.number])),
);
const discovery = discoveryByIssue(playlists);
const recurring = recurringArtists(playlists)
  .filter((row) => row.issueCount > 1)
  .slice(0, 20);
const repeated = repeatedTracks(playlists).slice(0, 20);
const byNumber = new Map(issues.map((issue) => [issue.number, issue]));

const discoveryColumns = computed<Column[]>(() =>
  discovery.map((row) => ({
    key: row.playlist.id,
    label: String(row.playlist.number),
    value: row.newArtists.length,
    highlight: row.playlist.id === latest?.id,
    tooltip: t("series.discoveryTooltip", {
      issue: formatIssue(row.playlist.number),
      n: row.newArtists.length,
      total: row.artistCount,
      share: formatPercent(row.discoveryRate),
    }),
  })),
);
const labelEvery = Math.max(1, Math.ceil(discovery.length / 12));

/**
 * Formats a gap in days.
 * @param value - The gap, or null
 * @returns e.g. "12 days"
 */
function days(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const rounded = Math.round(value);
  return t("series.days", { n: rounded }, rounded);
}
</script>

<template>
  <div class="stack">
    <header>
      <h1 class="page-title">
        Pivəəkly <span class="grad">{{ t("series.titleAccent") }}</span>
      </h1>
    </header>

    <section class="glass panel" aria-labelledby="timeline-title">
      <h2 id="timeline-title" class="section-title">
        {{ t("series.timelineTitle") }}
      </h2>
      <p class="muted lede">{{ t("series.timelineLede") }}</p>
      <ReleaseTimeline
        v-if="timeline.releases.length > 0"
        :releases="timeline.releases"
        :highlight="timeline.maxGap"
      />
      <div class="tiles">
        <StatTile
          :label="t('series.averageGap')"
          :value="days(timeline.averageGapDays)"
        />
        <StatTile
          :label="t('series.minGap')"
          :value="days(timeline.minGap?.gapDays)"
          :detail="
            timeline.minGap
              ? t('series.before', { name: timeline.minGap.playlist.name })
              : undefined
          "
        />
        <StatTile
          :label="t('series.maxGap')"
          :value="days(timeline.maxGap?.gapDays)"
          :detail="
            timeline.maxGap
              ? t('series.before', { name: timeline.maxGap.playlist.name })
              : undefined
          "
        />
        <StatTile
          :label="t('series.firstRelease')"
          :value="formatDate(timeline.releases[0]?.releasedAt ?? null)"
          :detail="timeline.releases[0]?.playlist.name"
        />
      </div>
      <p v-if="missing.length > 0" class="muted missing">
        {{ t("series.missing", { list: missing.join(", ") }) }}
      </p>
    </section>

    <section class="glass panel" aria-labelledby="discovery-title">
      <h2 id="discovery-title" class="section-title">
        {{ t("series.discoveryTitle") }}
      </h2>
      <p class="muted lede">{{ t("series.discoveryLede") }}</p>
      <ColumnChart
        :columns="discoveryColumns"
        :label-every="labelEvery"
        :height="170"
        :label="t('series.discoveryTitle')"
      />
    </section>

    <div class="grid-2">
      <section class="glass panel" aria-labelledby="recurring-title">
        <h2 id="recurring-title" class="section-title">
          {{ t("series.recurringTitle") }}
        </h2>
        <div class="scroll">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">{{ t("series.artist") }}</th>
                <th scope="col">{{ t("series.issues") }}</th>
                <th scope="col">{{ t("series.first") }}</th>
                <th scope="col">{{ t("series.last") }}</th>
                <th scope="col">
                  <span v-tooltip="t('series.streakHint')" tabindex="0">{{
                    t("series.streak")
                  }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in recurring" :key="row.artist.id">
                <td>
                  <RouterLink
                    :to="{ name: 'artist', params: { id: row.artist.id } }"
                    class="who"
                  >
                    <CoverImage
                      :src="profile(row.artist.id)?.imageUrl ?? null"
                      class="who__image"
                    />
                    {{ row.artist.name }}
                  </RouterLink>
                </td>
                <td class="tabular">{{ row.issueCount }}</td>
                <td class="tabular">{{ formatIssue(row.firstIssue) }}</td>
                <td class="tabular">{{ formatIssue(row.lastIssue) }}</td>
                <td class="tabular">{{ row.longestStreak }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="recurring.length === 0" class="muted">
          {{ t("series.noneRecurring") }}
        </p>
      </section>

      <section class="glass panel" aria-labelledby="repeated-title">
        <h2 id="repeated-title" class="section-title">
          {{ t("series.repeatedTitle") }}
        </h2>
        <ul class="repeats">
          <li v-for="row in repeated" :key="row.track.id">
            <CoverImage
              :src="row.track.album.imageUrl"
              class="repeats__cover"
            />
            <span class="repeats__track">
              <a :href="row.track.url" target="_blank" rel="noopener">{{
                row.track.title
              }}</a>
              <span class="muted">{{
                row.track.artists.map((artist) => artist.name).join(", ")
              }}</span>
            </span>
            <span class="repeats__issues">
              <RouterLink
                v-for="issue in row.issues"
                :key="issue"
                v-tooltip="byNumber.get(issue)?.name"
                :to="{
                  name: 'playlist',
                  params: { id: byNumber.get(issue)?.id ?? '' },
                }"
                class="repeats__issue"
                :aria-label="byNumber.get(issue)?.name"
              >
                <CoverImage
                  :src="byNumber.get(issue)?.coverUrl ?? null"
                  :palette="byNumber.get(issue)?.palette"
                />
              </RouterLink>
            </span>
          </li>
        </ul>
        <p v-if="repeated.length === 0" class="muted">
          {{ t("series.noneRepeated") }}
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lede {
  margin: -6px 0 14px;
  font-size: 14px;
  max-inline-size: 70ch;
}
.tiles {
  display: grid;
  gap: 14px;
  margin-top: 16px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr));
}
.missing {
  margin: 14px 0 0;
  font-size: 14px;
}
.scroll {
  overflow-x: auto;
}
.table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.table th {
  text-align: left;
  padding: 6px 8px;
  font-weight: 500;
  font-size: 12px;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
}
.table th span {
  cursor: help;
}
.table td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
.who {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  text-decoration: none;
}
.who__image {
  --cover-radius: 50%;
  inline-size: 32px;
  flex: none;
}
.repeats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}
.repeats li {
  display: flex;
  align-items: center;
  gap: 12px;
}
.repeats__cover {
  --cover-radius: 8px;
  inline-size: 44px;
  flex: none;
}
.repeats__track {
  display: grid;
  flex: 1;
  min-width: 0;
  font-size: 14px;
}
.repeats__track a {
  font-weight: 600;
  text-decoration: none;
}
.repeats__issues {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}
.repeats__issue {
  display: block;
  inline-size: 30px;
  --cover-radius: 6px;
  transition: transform 150ms ease;
}
.repeats__issue:hover {
  transform: scale(1.15);
}
</style>
