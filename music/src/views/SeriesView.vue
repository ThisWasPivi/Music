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
import SectionTitle from "@/components/ui/SectionTitle.vue";
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
      <h1 class="page-title">{{ t("series.title") }}</h1>
    </header>

    <section class="glass panel" aria-labelledby="timeline-title">
      <SectionTitle
        id="timeline-title"
        :title="t('series.timelineTitle')"
        :info="t('series.timelineLede')"
      />
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
      <SectionTitle
        id="discovery-title"
        :title="t('series.discoveryTitle')"
        :info="t('series.discoveryLede')"
      />
      <ColumnChart
        :columns="discoveryColumns"
        :label-every="labelEvery"
        :height="170"
        :label="t('series.discoveryTitle')"
      />
    </section>

    <div class="grid-2">
      <section class="glass panel" aria-labelledby="recurring-title">
        <SectionTitle
          id="recurring-title"
          :title="t('series.recurringTitle')"
          :info="t('series.recurringInfo')"
        />
        <div v-drag-scroll class="scroll">
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
        <SectionTitle
          id="repeated-title"
          :title="t('series.repeatedTitle')"
          :info="t('series.repeatedInfo')"
        />
        <ul class="repeats">
          <li v-for="row in repeated" :key="row.track.id" class="repeat">
            <CoverImage :src="row.track.album.imageUrl" class="repeat__cover" />
            <span class="repeat__track">
              <a :href="row.track.url" target="_blank" rel="noopener">{{
                row.track.title
              }}</a>
              <span class="muted">{{
                row.track.artists.map((artist) => artist.name).join(", ")
              }}</span>
            </span>
            <span class="repeat__count tabular">
              {{
                t(
                  "artist.issueCount",
                  { n: row.issues.length },
                  row.issues.length,
                )
              }}
            </span>
            <span class="repeat__issues">
              <RouterLink
                v-for="issue in row.issues"
                :key="issue"
                v-tooltip="byNumber.get(issue)?.name"
                :to="{
                  name: 'playlist',
                  params: { id: byNumber.get(issue)?.id ?? '' },
                }"
                class="repeat__issue tabular"
                :aria-label="byNumber.get(issue)?.name"
              >
                <CoverImage
                  :src="byNumber.get(issue)?.coverUrl ?? null"
                  :palette="byNumber.get(issue)?.palette"
                  class="repeat__thumb"
                />
                {{ issue }}
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
.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 16px;
}
/* Tiles share each row and the last row stretches, so no tile is left alone. */
.tiles > * {
  flex: 1 1 130px;
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
.who {
  transition: color 160ms ease;
}
.who:hover {
  color: var(--accent);
}
.who__image {
  --cover-radius: 50%;
  inline-size: 32px;
  flex: none;
}
.who:hover .who__image {
  transform: scale(1.12);
}
.repeats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
/*
 * One repeated track: cover, title and artists with the issue count on
 * the first row; the issues it appears in as numbered pills underneath,
 * wrapping as needed, so long titles and many issues never squeeze.
 */
.repeat {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  grid-template-areas:
    "cover track count"
    "cover issues issues";
  align-items: center;
  gap: 4px 12px;
  padding: 10px;
  border-radius: 16px;
  background: color-mix(in oklab, var(--glass) 60%, transparent);
  border: 1px solid var(--line);
}
.repeat__cover {
  grid-area: cover;
  align-self: start;
  inline-size: 48px;
  --cover-radius: 10px;
}
.repeat__track {
  grid-area: track;
  display: grid;
  min-width: 0;
  font-size: 14px;
  line-height: 1.3;
}
.repeat__track > * {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Titles may take two lines before they are cut; artists keep one. */
.repeat__track > a {
  display: -webkit-box;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.repeat__track a {
  justify-self: start;
  max-inline-size: 100%;
  font-weight: 650;
  text-decoration: none;
  border-radius: 5px;
  transition:
    color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease;
}
.repeat__track a:hover {
  color: var(--accent);
  background: color-mix(in oklab, var(--accent) 16%, transparent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 16%, transparent);
}
.repeat__count {
  grid-area: count;
  align-self: start;
  padding: 2px 9px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--accent) 16%, transparent);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.repeat__issues {
  grid-area: issues;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.repeat__issue {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px 3px 3px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.repeat__issue:hover {
  background: var(--glass-strong);
  border-color: color-mix(in oklab, var(--accent) 45%, var(--glass-border));
  transform: translateY(-1px);
}
.repeat__thumb {
  inline-size: 22px;
  --cover-radius: 50%;
}
/* On phones the issues run under the cover too, using the full width. */
@media (max-width: 480px) {
  .repeat {
    grid-template-areas:
      "cover track count"
      "issues issues issues";
  }
  .repeat__cover {
    align-self: center;
  }
}
</style>
