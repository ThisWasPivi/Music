<script setup lang="ts">
/**
 * HeatmapCalendar component
 * GitHub-style calendar of the days tracks were added, one block per year.
 * Each block is a 53-column grid that fills the available width, so it
 * never scrolls sideways; on phones a year is split into two half-years of
 * 27 weeks, which doubles the size of each day. Colours come from
 * `--heat-0` … `--heat-4`.
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useMediaQuery } from "@/composables/useMediaQuery.ts";
import type { Heatmap, HeatmapDay } from "@/services/stats";
import { formatDate } from "@/utils/format.ts";

const props = defineProps<{
  /** The calendars to draw. */
  heatmap: Heatmap;
}>();

const { t, locale } = useI18n();
const compact = useMediaQuery("(max-width: 640px)");

/* Weeks per row: the whole year, or half of it on phones. */
const columns = computed(() => (compact.value ? 27 : 53));

/**
 * One row of weeks with the months that start in it.
 * @property weeks - The weeks, each a column of seven days
 * @property labels - Month names and the column each starts in
 */
interface Chunk {
  weeks: (HeatmapDay | null)[][];
  labels: { column: number; text: string }[];
}

/** Each year cut into rows of weeks, with month labels per row. */
const chunks = computed<Chunk[][]>(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, {
    month: "short",
    timeZone: "UTC",
  });
  return props.heatmap.years.map((year) => {
    const rows: Chunk[] = [];
    for (let start = 0; start < year.weeks.length; start += columns.value) {
      const weeks = year.weeks.slice(start, start + columns.value);
      const labels: Chunk["labels"] = [];
      let previous = -1;
      weeks.forEach((week, index) => {
        const day = week.find((entry): entry is HeatmapDay => entry !== null);
        if (!day) return;
        const month = Number(day.date.slice(5, 7)) - 1;
        if (month !== previous && day.date.slice(8) <= "07") {
          labels.push({
            column: index + 1,
            text: formatter
              .format(new Date(Date.UTC(year.year, month, 1)))
              .replace(".", ""),
          });
        }
        previous = month;
      });
      rows.push({ weeks, labels });
    }
    return rows;
  });
});

/**
 * Maps a daily count to one of five intensity levels.
 * @param count - Tracks added that day
 * @returns The level, 0 for none
 */
function level(count: number): number {
  if (count === 0 || props.heatmap.max === 0) return 0;
  return Math.min(4, Math.ceil((count / props.heatmap.max) * 4));
}

/**
 * Tooltip text of one day.
 * @param day - The day
 * @returns e.g. "3 tracks · 14 Jan 2024"
 */
function dayLabel(day: HeatmapDay): string {
  return `${t("charts.tracksAdded", { n: day.count }, day.count)} · ${formatDate(`${day.date}T00:00:00Z`)}`;
}
</script>

<template>
  <figure class="heatmap">
    <section
      v-for="(year, yearIndex) in heatmap.years"
      :key="year.year"
      class="heatmap__year"
    >
      <header class="heatmap__head">
        <strong class="tabular">{{ year.year }}</strong>
        <span class="muted tabular">{{
          t("charts.tracksAdded", { n: year.total }, year.total)
        }}</span>
      </header>
      <div
        class="heatmap__rows"
        role="img"
        :aria-label="`${year.year}: ${t('charts.tracksAdded', { n: year.total }, year.total)}`"
      >
        <div
          v-for="(chunk, chunkIndex) in chunks[yearIndex]"
          :key="chunkIndex"
          class="heatmap__chunk"
        >
          <div class="heatmap__months" aria-hidden="true">
            <span
              v-for="month in chunk.labels"
              :key="month.column"
              :style="{ gridColumn: `${month.column} / span 4` }"
            >
              {{ month.text }}
            </span>
          </div>
          <div class="heatmap__grid">
            <template v-for="(week, column) in chunk.weeks" :key="column">
              <span
                v-for="(day, row) in week"
                :key="`${column}-${row}`"
                v-tooltip="day ? dayLabel(day) : undefined"
                :class="
                  day
                    ? `heatmap__cell heatmap__cell--${level(day.count)}`
                    : 'heatmap__cell heatmap__cell--pad'
                "
                :style="{ animationDelay: `${column * 10}ms` }"
              />
            </template>
          </div>
        </div>
      </div>
    </section>
    <figcaption class="heatmap__legend">
      <span>{{ t("charts.less") }}</span>
      <span
        v-for="step in 5"
        :key="step"
        :class="`heatmap__cell heatmap__cell--${step - 1}`"
        aria-hidden="true"
      />
      <span>{{ t("charts.more") }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.heatmap {
  display: grid;
  gap: 22px;
  margin: 0;
}
.heatmap__year {
  display: grid;
  gap: 6px;
}
.heatmap__year {
  --weeks: 53;
  max-inline-size: calc(53 * 18px + 52 * 4px);
}
.heatmap__rows,
.heatmap__chunk {
  display: grid;
  gap: 4px;
}
.heatmap__rows {
  gap: 12px;
}
@media (max-width: 640px) {
  .heatmap__year {
    --weeks: 27;
  }
}
.heatmap__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
}
.heatmap__months,
.heatmap__grid {
  display: grid;
  grid-template-columns: repeat(var(--weeks), minmax(0, 18px));
  justify-content: space-between;
  column-gap: clamp(1px, 0.35vw, 4px);
}
.heatmap__months {
  font-size: 11px;
  color: var(--chart-muted);
}
.heatmap__months span {
  white-space: nowrap;
}
.heatmap__grid {
  grid-template-rows: repeat(7, auto);
  grid-auto-flow: column;
  row-gap: clamp(1px, 0.35vw, 4px);
}
.heatmap__cell {
  display: block;
  aspect-ratio: 1;
  border-radius: 28%;
  animation: heat-pop 500ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
  transition:
    transform 150ms ease,
    filter 150ms ease;
}
.heatmap__grid .heatmap__cell:not(.heatmap__cell--pad):hover {
  transform: scale(1.6);
  filter: brightness(1.25);
  position: relative;
  z-index: 1;
}
@keyframes heat-pop {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
}
.heatmap__cell--pad {
  visibility: hidden;
}
.heatmap__cell--0 {
  background: var(--heat-0);
}
.heatmap__cell--1 {
  background: var(--heat-1);
}
.heatmap__cell--2 {
  background: var(--heat-2);
}
.heatmap__cell--3 {
  background: var(--heat-3);
}
.heatmap__cell--4 {
  background: var(--heat-4);
  box-shadow: 0 0 8px color-mix(in oklab, var(--heat-4) 60%, transparent);
}
.heatmap__legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 11px;
  color: var(--chart-muted);
}
.heatmap__legend .heatmap__cell {
  inline-size: 11px;
  animation: none;
}
</style>
