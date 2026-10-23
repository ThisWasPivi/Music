import type { AlbumRef, ArtistRef, Playlist, Track } from "@music/shared";

/**
 * Totals over a set of tracks.
 * @property trackCount - Number of entries, repeats included
 * @property uniqueTrackCount - Number of distinct tracks
 * @property totalMs - Sum of the durations
 * @property averageMs - Mean duration, 0 for no tracks
 * @property longest - Longest track, if any
 * @property shortest - Shortest track, if any
 * @property explicitShare - Share of explicit entries in [0, 1]
 * @property uniqueArtistCount - Number of distinct credited artists
 * @property uniqueAlbumCount - Number of distinct albums
 */
export interface LibrarySummary {
  trackCount: number;
  uniqueTrackCount: number;
  totalMs: number;
  averageMs: number;
  longest: Track | null;
  shortest: Track | null;
  explicitShare: number;
  uniqueArtistCount: number;
  uniqueAlbumCount: number;
}

/**
 * Flattens the tracks of several playlists, keeping repeats.
 * @param playlists - The playlists
 * @returns Every track entry
 */
export function tracksOf(playlists: readonly Playlist[]): Track[] {
  return playlists.flatMap((playlist) => playlist.tracks);
}

/**
 * Summarizes a list of tracks.
 * @param tracks - The track entries
 * @returns The totals
 */
export function summarize(tracks: readonly Track[]): LibrarySummary {
  let longest: Track | null = null;
  let shortest: Track | null = null;
  let totalMs = 0;
  let explicit = 0;
  const artists = new Set<string>();
  const albums = new Set<string>();
  const unique = new Set<string>();

  for (const track of tracks) {
    totalMs += track.durationMs;
    if (track.explicit) explicit += 1;
    if (!longest || track.durationMs > longest.durationMs) longest = track;
    if (!shortest || track.durationMs < shortest.durationMs) shortest = track;
    for (const artist of track.artists) artists.add(artist.id);
    albums.add(track.album.id);
    unique.add(track.id);
  }

  return {
    trackCount: tracks.length,
    uniqueTrackCount: unique.size,
    totalMs,
    averageMs: tracks.length === 0 ? 0 : totalMs / tracks.length,
    longest,
    shortest,
    explicitShare: tracks.length === 0 ? 0 : explicit / tracks.length,
    uniqueArtistCount: artists.size,
    uniqueAlbumCount: albums.size,
  };
}

/**
 * One row of a ranking.
 * @property item - The ranked artist or album
 * @property trackCount - Entries crediting it
 * @property totalMs - Minutes of those entries, in milliseconds
 */
export interface RankingRow<T> {
  item: T;
  trackCount: number;
  totalMs: number;
}

/** What a ranking orders by. */
export type RankingMetric = "tracks" | "minutes";

/**
 * Accumulates entries per key, then sorts by the chosen metric.
 * @param tracks - The track entries
 * @param keysOf - The ranked items each entry credits
 * @param metric - What to order by
 * @param limit - Maximum number of rows
 * @returns The ranking, ties broken by name
 */
function rank<T extends { id: string; name: string }>(
  tracks: readonly Track[],
  keysOf: (track: Track) => readonly T[],
  metric: RankingMetric,
  limit: number,
): RankingRow<T>[] {
  const rows = new Map<string, RankingRow<T>>();
  for (const track of tracks) {
    for (const item of keysOf(track)) {
      const row = rows.get(item.id) ?? { item, trackCount: 0, totalMs: 0 };
      row.trackCount += 1;
      row.totalMs += track.durationMs;
      rows.set(item.id, row);
    }
  }

  /**
   * Reads the metric the ranking orders by.
   * @param row - A ranking row
   * @returns Its entry count or its total duration
   */
  const value = (row: RankingRow<T>): number =>
    metric === "tracks" ? row.trackCount : row.totalMs;
  return [...rows.values()]
    .sort(
      (a, b) => value(b) - value(a) || a.item.name.localeCompare(b.item.name),
    )
    .slice(0, limit);
}

/**
 * Ranks the credited artists.
 * @param tracks - The track entries
 * @param metric - Order by entry count or by minutes
 * @param limit - Maximum number of rows
 * @returns The top artists
 */
export function topArtists(
  tracks: readonly Track[],
  metric: RankingMetric = "tracks",
  limit = 10,
): RankingRow<ArtistRef>[] {
  return rank(tracks, (track) => track.artists, metric, limit);
}

/**
 * Ranks the albums.
 * @param tracks - The track entries
 * @param metric - Order by entry count or by minutes
 * @param limit - Maximum number of rows
 * @returns The top albums
 */
export function topAlbums(
  tracks: readonly Track[],
  metric: RankingMetric = "tracks",
  limit = 10,
): RankingRow<AlbumRef>[] {
  return rank(tracks, (track) => [track.album], metric, limit);
}

/**
 * A histogram bucket.
 * @property key - The bucket's start (a year or a decade's first year)
 * @property count - Entries in the bucket
 */
export interface Bucket {
  key: number;
  count: number;
}

/**
 * Counts entries per release year or decade, filling empty buckets.
 * @param tracks - The track entries
 * @param size - Bucket width in years: 1 for years, 10 for decades
 * @returns Contiguous buckets from the oldest to the newest release
 */
export function releaseDistribution(
  tracks: readonly Track[],
  size: 1 | 10 = 10,
): Bucket[] {
  const counts = new Map<number, number>();
  for (const track of tracks) {
    if (track.releaseYear === null) continue;
    const key = Math.floor(track.releaseYear / size) * size;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  const keys = [...counts.keys()];
  const buckets: Bucket[] = [];
  for (let key = Math.min(...keys); key <= Math.max(...keys); key += size) {
    buckets.push({ key, count: counts.get(key) ?? 0 });
  }
  return buckets;
}
