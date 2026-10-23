import type { Track } from "@music/shared";

/**
 * One day of the calendar heatmap.
 * @property date - Calendar day as `YYYY-MM-DD` (UTC)
 * @property count - Tracks added that day
 */
export interface HeatmapDay {
  date: string;
  count: number;
}

/**
 * One calendar year, GitHub style: columns are weeks starting on Monday,
 * `null` pads the days before 1 January and after 31 December.
 * @property year - The calendar year
 * @property weeks - Seven slots per week, first week first
 * @property total - Tracks added during the year
 */
export interface HeatmapYear {
  year: number;
  weeks: (HeatmapDay | null)[][];
  total: number;
}

/**
 * Calendar heatmap of the series, one block per year.
 * @property years - Years from the first to the last addition
 * @property max - Highest daily count, shared by every year's colour scale
 * @property total - Every track entry
 */
export interface Heatmap {
  years: HeatmapYear[];
  max: number;
  total: number;
}

const DAY_MS = 86_400_000;

/**
 * Truncates a timestamp to its UTC calendar day.
 * @param iso - An ISO timestamp
 * @returns Milliseconds at that day's midnight UTC
 */
function dayStart(iso: string): number {
  const date = new Date(iso);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Buckets `added_at` timestamps into one Monday-first calendar per year.
 * @param tracks - The track entries
 * @returns The calendars, empty when there are no tracks
 */
export function buildAddedHeatmap(tracks: readonly Track[]): Heatmap {
  const counts = new Map<number, number>();
  for (const track of tracks) {
    const day = dayStart(track.addedAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  if (counts.size === 0) return { years: [], max: 0, total: 0 };

  const days = [...counts.keys()];
  const firstYear = new Date(Math.min(...days)).getUTCFullYear();
  const lastYear = new Date(Math.max(...days)).getUTCFullYear();
  let max = 0;
  const years: HeatmapYear[] = [];

  for (let year = firstYear; year <= lastYear; year += 1) {
    const january = Date.UTC(year, 0, 1);
    const nextJanuary = Date.UTC(year + 1, 0, 1);
    /* getUTCDay is 0 on Sunday; shift so weeks start on Monday. */
    const start = january - ((new Date(january).getUTCDay() + 6) % 7) * DAY_MS;
    const weeks: (HeatmapDay | null)[][] = [];
    let total = 0;
    for (
      let weekStart = start;
      weekStart < nextJanuary;
      weekStart += 7 * DAY_MS
    ) {
      const week: (HeatmapDay | null)[] = [];
      for (let offset = 0; offset < 7; offset += 1) {
        const day = weekStart + offset * DAY_MS;
        if (day < january || day >= nextJanuary) {
          week.push(null);
          continue;
        }
        const count = counts.get(day) ?? 0;
        total += count;
        max = Math.max(max, count);
        week.push({ date: new Date(day).toISOString().slice(0, 10), count });
      }
      weeks.push(week);
    }
    years.push({ year, weeks, total });
  }
  return { years, max, total: tracks.length };
}
