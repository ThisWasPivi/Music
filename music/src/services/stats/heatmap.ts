import type { Track } from "@music/shared";

/**
 * One cell of the calendar heatmap.
 * @property date - Calendar day as `YYYY-MM-DD` (UTC)
 * @property count - Tracks added that day
 */
export interface HeatmapDay {
  date: string;
  count: number;
}

/**
 * A GitHub-style calendar: columns are weeks starting on Monday.
 * @property weeks - Seven days per week, oldest week first
 * @property max - Highest daily count, for colour scaling
 * @property total - Sum of every day
 */
export interface Heatmap {
  weeks: HeatmapDay[][];
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
 * Buckets `added_at` timestamps into a week-by-day calendar.
 * @param tracks - The track entries
 * @returns The calendar, empty when there are no tracks
 */
export function buildAddedHeatmap(tracks: readonly Track[]): Heatmap {
  const counts = new Map<number, number>();
  for (const track of tracks) {
    const day = dayStart(track.addedAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  if (counts.size === 0) return { weeks: [], max: 0, total: 0 };

  const days = [...counts.keys()];
  const first = Math.min(...days);
  /* getUTCDay is 0 on Sunday; shift so weeks start on Monday. */
  const start = first - ((new Date(first).getUTCDay() + 6) % 7) * DAY_MS;
  const end = Math.max(...days);

  const weeks: HeatmapDay[][] = [];
  let max = 0;
  for (let weekStart = start; weekStart <= end; weekStart += 7 * DAY_MS) {
    const week: HeatmapDay[] = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const day = weekStart + offset * DAY_MS;
      const count = counts.get(day) ?? 0;
      max = Math.max(max, count);
      week.push({ date: new Date(day).toISOString().slice(0, 10), count });
    }
    weeks.push(week);
  }
  return { weeks, max, total: tracks.length };
}
