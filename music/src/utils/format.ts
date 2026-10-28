import { currentLocale } from "@/i18n/index.ts";

/**
 * Formats a track length as `m:ss`.
 * @param ms - Duration in milliseconds
 * @returns The clock-style duration
 */
export function formatTrackDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Formats a long duration as hours and minutes, e.g. "1 h 42 min".
 * @param ms - Duration in milliseconds
 * @returns The human-readable duration
 */
export function formatLongDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/**
 * Formats a date in the active locale, e.g. "14 Jan 2024".
 * @param iso - An ISO timestamp, or null
 * @returns The date, or an em dash when missing
 */
export function formatDate(iso: string | null): string {
  if (iso === null) return "—";
  return new Date(iso).toLocaleDateString(currentLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Formats a share as a whole percentage.
 * @param share - A value in [0, 1]
 * @returns The percentage, e.g. "14%"
 */
export function formatPercent(share: number): string {
  return new Intl.NumberFormat(currentLocale(), {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(share);
}

/**
 * Formats a count with the active locale's grouping.
 * @param value - The number
 * @returns The formatted number
 */
export function formatNumber(value: number): string {
  return value.toLocaleString(currentLocale(), { maximumFractionDigits: 1 });
}
