<script setup lang="ts">
/**
 * ReleaseTimeline component
 * The series on a calendar: one row per year, January to December, with
 * every playlist's cover as a round dot at its release date, ringed in its
 * own colour. Busy spells crowd a row and pauses leave it empty; playlists
 * released close together stack above and below the line instead of
 * overlapping. The longest pause is drawn as a striped stretch. Dots link
 * to their playlist and show its cover, name and date in a tooltip.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useEntered } from "@/composables/useEntered.ts";
import type { Release } from "@/services/stats";
import { markerColor } from "@/utils/color.ts";
import { formatDate } from "@/utils/format.ts";
import { playlistTooltip } from "@/utils/tooltips.ts";

const props = withDefaults(
  defineProps<{
    /** Releases in chronological order. */
    releases: readonly Release[];

    /** Release closing the longest gap, whose pause is drawn striped. */
    highlight?: Release | null;
  }>(),
  { highlight: null },
);

const { t, locale } = useI18n();
const entered = useEntered();

/* Dot diameter in pixels, matching --dot-size in the styles. */
const DOT = 26;
/* Stacking lanes around the line, nearest first. */
const LANES = [0, -1, 1, -2, 2, -3, 3, -4, 4] as const;

/* Width of a year's track, measured so close dots can be stacked. */
const track = ref<HTMLElement | null>(null);
const trackWidth = ref(800);
let observer: ResizeObserver | undefined;
onMounted(() => {
  if (!track.value || typeof ResizeObserver === "undefined") return;
  observer = new ResizeObserver(([entry]) => {
    if (entry) trackWidth.value = entry.contentRect.width;
  });
  observer.observe(track.value);
});
onBeforeUnmount(() => observer?.disconnect());

/**
 * Where a moment falls within its year.
 * @param time - Milliseconds since the epoch
 * @returns The year and the position in it, in [0, 1)
 */
function place(time: number): { year: number; at: number } {
  const year = new Date(time).getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  return { year, at: (time - start) / (Date.UTC(year + 1, 0, 1) - start) };
}

/** Initials of the months in the interface language. */
const months = computed(() => {
  const format = new Intl.DateTimeFormat(locale.value, {
    month: "short",
    timeZone: "UTC",
  });
  return Array.from({ length: 12 }, (_, month) =>
    format.format(new Date(Date.UTC(2000, month, 1))).replace(".", ""),
  );
});

/**
 * One playlist on its year's row.
 * @property release - The release
 * @property at - Position in the year, in [0, 1)
 * @property lane - Stacking lane: 0 on the line, negative above
 * @property order - Position in the whole series, for the entrance
 * @property color - Ring and glow colour
 */
interface Dot {
  release: Release;
  at: number;
  lane: number;
  order: number;
  color: string;
}

/**
 * A stretch of the longest pause within one year.
 * @property from - Start, in [0, 1]
 * @property to - End, in [0, 1]
 */
interface Pause {
  from: number;
  to: number;
}

/**
 * One year of the calendar.
 * @property year - The year
 * @property dots - Its issues, in date order
 * @property pauses - Stretches of the longest pause inside it
 * @property reach - Lanes used on each side of the line
 */
interface Row {
  year: number;
  dots: Dot[];
  pauses: Pause[];
  reach: number;
}

const rows = computed<Row[]>(() => {
  const releases = props.releases;
  if (releases.length === 0) return [];
  const total = Math.max(1, releases.length - 1);
  const first = place(Date.parse(releases[0]?.releasedAt ?? "")).year;
  const last = place(Date.parse(releases.at(-1)?.releasedAt ?? "")).year;
  /* Two dots closer than this, as a fraction of the year, need separate lanes. */
  const room = (DOT + 6) / Math.max(1, trackWidth.value);

  const byYear = new Map<number, Row>();
  for (let year = first; year <= last; year += 1) {
    byYear.set(year, { year, dots: [], pauses: [], reach: 0 });
  }

  releases.forEach((release, order) => {
    const { year, at } = place(Date.parse(release.releasedAt));
    const color = markerColor(release.playlist.palette, order / total);
    byYear.get(year)?.dots.push({
      release,
      at,
      lane: 0,
      order,
      color,
    });
  });

  for (const row of byYear.values()) {
    const lastInLane = new Map<number, number>();
    for (const dot of row.dots) {
      dot.lane =
        LANES.find(
          (lane) =>
            dot.at - (lastInLane.get(lane) ?? Number.NEGATIVE_INFINITY) >= room,
        ) ?? 0;
      lastInLane.set(dot.lane, dot.at);
      row.reach = Math.max(row.reach, Math.abs(dot.lane));
    }
  }

  /* The longest pause, split across the years it spans. */
  const index = props.highlight ? releases.indexOf(props.highlight) : -1;
  const before = index > 0 ? releases[index - 1] : undefined;
  if (props.highlight && before) {
    const start = place(Date.parse(before.releasedAt));
    const end = place(Date.parse(props.highlight.releasedAt));
    for (let year = start.year; year <= end.year; year += 1) {
      byYear.get(year)?.pauses.push({
        from: year === start.year ? start.at : 0,
        to: year === end.year ? end.at : 1,
      });
    }
  }

  return [...byYear.values()];
});

const pauseLabel = computed(() => {
  const gap = props.highlight?.gapDays;
  if (!props.highlight || !gap) return "";
  const n = Math.round(gap);
  return t("series.pauseLabel", {
    days: t("series.days", { n }, n),
    name: props.highlight.playlist.name,
  });
});

const summary = computed(() =>
  t("series.timelineSummary", {
    n: props.releases.length,
    from: formatDate(props.releases[0]?.releasedAt ?? null),
    to: formatDate(props.releases.at(-1)?.releasedAt ?? null),
  }),
);
</script>

<template>
  <div
    class="timeline"
    :class="{ 'timeline--in': entered }"
    role="group"
    :aria-label="summary"
  >
    <div class="timeline__row" aria-hidden="true">
      <span />
      <div class="timeline__months">
        <span v-for="month in months" :key="month">{{ month }}</span>
      </div>
    </div>

    <div
      v-for="(row, rowIndex) in rows"
      :key="row.year"
      class="timeline__row"
      :style="{
        '--reach': row.reach,
        '--row': rowIndex,
      }"
    >
      <span class="timeline__year tabular">{{ row.year }}</span>
      <div
        :ref="rowIndex === 0 ? (el) => (track = el as HTMLElement) : undefined"
        class="timeline__track"
      >
        <span class="timeline__line" aria-hidden="true" />
        <span
          v-for="pause in row.pauses"
          :key="pause.from"
          class="timeline__pause"
          :style="{
            insetInlineStart: `${pause.from * 100}%`,
            inlineSize: `${(pause.to - pause.from) * 100}%`,
          }"
          aria-hidden="true"
        />
        <ol class="timeline__dots">
          <li
            v-for="dot in row.dots"
            :key="dot.release.playlist.id"
            class="timeline__slot"
            :style="{
              insetInlineStart: `${dot.at * 100}%`,
              '--lane': dot.lane,
              '--order': dot.order,
              '--dot': dot.color,
              '--from': dot.release.playlist.palette[0] ?? dot.color,
            }"
          >
            <RouterLink
              v-tooltip="playlistTooltip(dot.release.playlist)"
              :to="{
                name: 'playlist',
                params: { id: dot.release.playlist.id },
              }"
              :aria-label="`${dot.release.playlist.name}, ${formatDate(dot.release.releasedAt)}`"
              class="timeline__dot"
              :class="{
                'timeline__dot--after-pause': dot.release === highlight,
              }"
            >
              <img
                v-if="dot.release.playlist.coverUrl"
                :src="dot.release.playlist.coverUrl"
                alt=""
                loading="lazy"
                decoding="async"
                width="64"
                height="64"
              />
            </RouterLink>
          </li>
        </ol>
      </div>
    </div>

    <p v-if="pauseLabel" class="timeline__legend">
      <span class="timeline__swatch" aria-hidden="true" />
      {{ pauseLabel }}
    </p>
  </div>
</template>

<style scoped>
.timeline {
  --dot-size: 26px;
  --step: 26px;
  --label: 52px;
  display: grid;
  gap: 4px;
}
@media (max-width: 560px) {
  .timeline {
    --label: 40px;
  }
}
.timeline__row {
  display: grid;
  grid-template-columns: var(--label) minmax(0, 1fr);
  align-items: center;
}
/* Months and tracks are inset by half a dot, so dots at the year's edges stay inside. */
.timeline__months,
.timeline__track {
  margin-inline: calc(var(--dot-size) / 2);
}
.timeline__months {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  font-size: 11px;
  font-weight: 600;
  color: var(--chart-muted);
  text-transform: capitalize;
}
.timeline__months span {
  padding-inline-start: 4px;
  border-inline-start: 1px solid var(--chart-grid);
  overflow: hidden;
  white-space: nowrap;
}
@media (max-width: 560px) {
  .timeline__months span {
    font-size: 0;
  }
  .timeline__months span::first-letter {
    font-size: 10px;
  }
}
.timeline__year {
  font: 700 13px var(--font-display);
  color: var(--muted);
}
/* A row grows with the dots stacked on it; month lines run across it. */
.timeline__track {
  position: relative;
  block-size: calc((2 * var(--reach) + 1) * var(--step) + 18px);
  background-image: linear-gradient(
    90deg,
    var(--chart-grid) 1px,
    transparent 1px
  );
  background-size: calc(100% / 12) 100%;
}
.timeline__line {
  position: absolute;
  inset: 50% 0 auto;
  block-size: 3px;
  margin-block-start: -1.5px;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--c1), var(--c2), var(--c3));
  opacity: 0.55;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: calc(var(--row) * 120ms);
}
.timeline--in .timeline__line {
  transform: none;
}
.timeline__pause {
  position: absolute;
  inset-block: 6px;
  border-radius: 10px;
  background: repeating-linear-gradient(
    -45deg,
    color-mix(in oklab, var(--c3) 22%, transparent) 0 6px,
    transparent 6px 12px
  );
  opacity: 0;
  transition: opacity 600ms ease 700ms;
}
.timeline--in .timeline__pause {
  opacity: 1;
}
.timeline__legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0;
  padding-inline-start: var(--label);
  font-size: 12px;
  color: var(--muted);
}
.timeline__swatch {
  inline-size: 28px;
  block-size: 14px;
  border-radius: 5px;
  background: repeating-linear-gradient(
    -45deg,
    color-mix(in oklab, var(--c3) 45%, transparent) 0 4px,
    transparent 4px 8px
  );
}
.timeline__dots {
  list-style: none;
  margin: 0;
  padding: 0;
}
.timeline__slot {
  position: absolute;
  inset-block-start: 50%;
  translate: -50% calc(-50% + var(--lane) * var(--step));
  z-index: 1;
  animation: dot-in 460ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  animation-delay: calc(300ms + var(--order) * 35ms);
}
@keyframes dot-in {
  from {
    opacity: 0;
    scale: 0.3;
  }
}
.timeline__slot:hover,
.timeline__slot:focus-within {
  z-index: 2;
}
.timeline__dot {
  display: grid;
  place-items: center;
  inline-size: var(--dot-size);
  block-size: var(--dot-size);
  overflow: hidden;
  border-radius: 50%;
  /* Shown while the cover loads, or when there is none. */
  background: radial-gradient(
    circle at 35% 30%,
    color-mix(in oklab, var(--from) 55%, #fff),
    var(--from) 72%
  );
  /* A ring in the playlist's own colour, then its glow. */
  box-shadow:
    0 0 0 2px var(--dot),
    0 4px 14px -2px color-mix(in oklab, var(--dot) 70%, transparent);
  text-decoration: none;
  transition:
    scale 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 200ms ease;
}
.timeline__dot img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
/* The playlist that ended the longest pause gets a soft halo. */
.timeline__dot--after-pause {
  box-shadow:
    0 0 0 2px var(--dot),
    0 0 0 6px color-mix(in oklab, var(--dot) 30%, transparent),
    0 0 22px var(--dot);
}
.timeline__dot:hover,
.timeline__dot:focus-visible {
  scale: 1.45;
  box-shadow:
    0 0 0 2px var(--dot),
    0 0 24px var(--dot);
}
</style>
