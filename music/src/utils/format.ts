const LOCALE = "it-IT";

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
 * Formats a date for display, e.g. "14 gen 2024".
 * @param iso - An ISO timestamp, or null
 * @returns The date, or an em dash when missing
 */
export function formatDate(iso: string | null): string {
  if (iso === null) return "—";
  return new Date(iso).toLocaleDateString(LOCALE, {
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
  return `${Math.round(share * 100)}%`;
}

/**
 * Formats a count with the locale's grouping, e.g. "1.234".
 * @param value - The number
 * @returns The formatted number
 */
export function formatNumber(value: number): string {
  return value.toLocaleString(LOCALE, { maximumFractionDigits: 1 });
}

/**
 * Formats an issue number for display.
 * @param issue - The issue number, or null
 * @returns "Nº 12", or "Fuori serie" for unnumbered playlists
 */
export function formatIssue(issue: number | null): string {
  return issue === null ? "Fuori serie" : `Nº ${issue}`;
}
