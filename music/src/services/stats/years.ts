import type { ArtistRef, Playlist, Track } from "@music/shared";

import { artistsOf } from "./artists.ts";
import { tracksOf } from "./library.ts";
import { seriesOrder } from "./series.ts";

/**
 * The year a playlist came out: the year of its first `added_at`.
 * @param playlist - The playlist
 * @returns The year, or null for a playlist without tracks
 */
export function releaseYear(playlist: Playlist): number | null {
  return playlist.firstAddedAt === null
    ? null
    : Number(playlist.firstAddedAt.slice(0, 4));
}

/**
 * Years in which at least one playlist came out.
 * @param playlists - Any published playlists
 * @returns The years, newest first
 */
export function releaseYears(playlists: readonly Playlist[]): number[] {
  return [
    ...new Set(playlists.flatMap((playlist) => releaseYear(playlist) ?? [])),
  ].sort((a, b) => b - a);
}

/**
 * One year of the series.
 * @property year - The year
 * @property playlists - Playlists that came out that year, in series order
 * @property tracks - Every track entry of those playlists
 * @property newArtists - Artists first featured that year, in order of appearance
 * @property longest - The longest playlist of the year
 * @property shortest - The shortest playlist of the year
 * @property busiestMonth - The month (0–11) with the most releases, and how many
 * @property previousCount - Playlists the year before, null for the first year
 */
export interface YearReview {
  year: number;
  playlists: Playlist[];
  tracks: Track[];
  newArtists: ArtistRef[];
  longest: Playlist | null;
  shortest: Playlist | null;
  busiestMonth: { month: number; count: number } | null;
  previousCount: number | null;
}

/**
 * Sums up one year: what came out, who showed up for the first time and
 * how it compares with the year before.
 * @param playlists - Every published playlist
 * @param year - The year to review
 * @returns The review; empty lists when nothing came out that year
 */
export function reviewYear(
  playlists: readonly Playlist[],
  year: number,
): YearReview {
  const ordered = seriesOrder(playlists);
  const ofYear = ordered.filter((playlist) => releaseYear(playlist) === year);

  /* Artists already featured before this year do not count as new. */
  const seen = new Set<string>();
  for (const playlist of ordered) {
    const released = releaseYear(playlist);
    if (released === null || released >= year) continue;
    for (const id of artistsOf(playlist).keys()) seen.add(id);
  }
  const newArtists: ArtistRef[] = [];
  for (const playlist of ofYear) {
    for (const artist of artistsOf(playlist).values()) {
      if (seen.has(artist.id)) continue;
      seen.add(artist.id);
      newArtists.push(artist);
    }
  }

  const byLength = [...ofYear].sort((a, b) => a.durationMs - b.durationMs);
  const months = new Map<number, number>();
  for (const playlist of ofYear) {
    const month = Number(playlist.firstAddedAt?.slice(5, 7)) - 1;
    months.set(month, (months.get(month) ?? 0) + 1);
  }
  const busiest = [...months.entries()].sort(
    (a, b) => b[1] - a[1] || a[0] - b[0],
  )[0];
  const years = releaseYears(playlists);

  return {
    year,
    playlists: ofYear,
    tracks: tracksOf(ofYear),
    newArtists,
    longest: byLength.at(-1) ?? null,
    shortest: byLength[0] ?? null,
    busiestMonth: busiest ? { month: busiest[0], count: busiest[1] } : null,
    previousCount: years.includes(year - 1)
      ? ordered.filter((playlist) => releaseYear(playlist) === year - 1).length
      : null,
  };
}
