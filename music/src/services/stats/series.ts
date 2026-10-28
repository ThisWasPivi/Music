import type { ArtistRef, Playlist, Track } from "@music/shared";

import { artistsOf } from "./artists.ts";

/**
 * Puts the playlists in series order: by release date, oldest first.
 *
 * The release date (the first `added_at`) is what every series has; a
 * number in the name is only a tie-breaker, so series without numbers work
 * the same way. Playlists without any track, and so without a date, go
 * last.
 * @param playlists - Any published playlists
 * @returns The playlists in series order
 */
export function seriesOrder(playlists: readonly Playlist[]): Playlist[] {
  return [...playlists].sort(
    (a, b) =>
      Number(a.firstAddedAt === null) - Number(b.firstAddedAt === null) ||
      (a.firstAddedAt ?? "").localeCompare(b.firstAddedAt ?? "") ||
      (a.number ?? Number.POSITIVE_INFINITY) -
        (b.number ?? Number.POSITIVE_INFINITY) ||
      a.name.localeCompare(b.name, "en", { numeric: true }),
  );
}

/**
 * One release on the series timeline.
 * @property playlist - The issue
 * @property releasedAt - Approximate release: its first `added_at`
 * @property gapDays - Days since the previous release, null for the first
 */
export interface Release {
  playlist: Playlist;
  releasedAt: string;
  gapDays: number | null;
}

/**
 * Release cadence of the series.
 * @property releases - Releases in chronological order
 * @property averageGapDays - Mean days between releases, null with fewer than two
 * @property minGap - The shortest gap and the release that closed it
 * @property maxGap - The longest gap and the release that closed it
 */
export interface ReleaseTimeline {
  releases: Release[];
  averageGapDays: number | null;
  minGap: Release | null;
  maxGap: Release | null;
}

const DAY_MS = 86_400_000;

/**
 * Places every dated issue on a real time axis and measures the gaps.
 *
 * Releases are approximated by the first `added_at`, since Spotify does not
 * expose when a playlist was published. No cadence is assumed.
 * @param playlists - Any published playlists
 * @returns The timeline and its gap statistics
 */
export function releaseTimeline(
  playlists: readonly Playlist[],
): ReleaseTimeline {
  const dated = playlists
    .filter(
      (playlist): playlist is Playlist & { firstAddedAt: string } =>
        playlist.firstAddedAt !== null,
    )
    .sort((a, b) => a.firstAddedAt.localeCompare(b.firstAddedAt));

  const releases: Release[] = dated.map((playlist, index) => {
    const previous = dated[index - 1];
    return {
      playlist,
      releasedAt: playlist.firstAddedAt,
      gapDays: previous
        ? (Date.parse(playlist.firstAddedAt) -
            Date.parse(previous.firstAddedAt)) /
          DAY_MS
        : null,
    };
  });

  const gaps = releases.filter((release) => release.gapDays !== null);
  let minGap: Release | null = null;
  let maxGap: Release | null = null;
  for (const release of gaps) {
    if (!minGap || (release.gapDays ?? 0) < (minGap.gapDays ?? 0))
      minGap = release;
    if (!maxGap || (release.gapDays ?? 0) > (maxGap.gapDays ?? 0))
      maxGap = release;
  }

  return {
    releases,
    averageGapDays:
      gaps.length === 0
        ? null
        : gaps.reduce((sum, release) => sum + (release.gapDays ?? 0), 0) /
          gaps.length,
    minGap,
    maxGap,
  };
}

/**
 * How an artist recurs across the series.
 * @property artist - The artist
 * @property issueCount - Playlists the artist appears in
 * @property first - The earliest playlist featuring them
 * @property last - The latest playlist featuring them
 * @property longestStreak - Most consecutive playlists featuring them
 * @property trackCount - Entries crediting the artist across the series
 */
export interface RecurringArtist {
  artist: ArtistRef;
  issueCount: number;
  first: Playlist;
  last: Playlist;
  longestStreak: number;
  trackCount: number;
}

/**
 * Measures how every artist recurs across the series.
 *
 * A streak counts consecutive playlists in series order.
 * @param playlists - Any published playlists
 * @returns One row per artist, most recurring first
 */
export function recurringArtists(
  playlists: readonly Playlist[],
): RecurringArtist[] {
  const issues = seriesOrder(playlists);
  const rows = new Map<
    string,
    RecurringArtist & { lastIndex: number; streak: number }
  >();

  issues.forEach((issue, index) => {
    for (const artist of artistsOf(issue).values()) {
      const row = rows.get(artist.id);
      if (!row) {
        rows.set(artist.id, {
          artist,
          issueCount: 1,
          first: issue,
          last: issue,
          longestStreak: 1,
          trackCount: 0,
          lastIndex: index,
          streak: 1,
        });
        continue;
      }
      row.issueCount += 1;
      row.last = issue;
      row.streak = row.lastIndex === index - 1 ? row.streak + 1 : 1;
      row.longestStreak = Math.max(row.longestStreak, row.streak);
      row.lastIndex = index;
    }
    for (const track of issue.tracks) {
      for (const artist of track.artists) {
        const row = rows.get(artist.id);
        if (row) row.trackCount += 1;
      }
    }
  });

  return [...rows.values()]
    .map(({ lastIndex: _lastIndex, streak: _streak, ...row }) => row)
    .sort(
      (a, b) =>
        b.issueCount - a.issueCount ||
        b.longestStreak - a.longestStreak ||
        a.artist.name.localeCompare(b.artist.name),
    );
}

/**
 * How much each issue introduced to the series.
 * @property playlist - The issue
 * @property newArtists - Artists appearing for the first time in the series
 * @property artistCount - Distinct artists in the issue
 * @property discoveryRate - `newArtists.length / artistCount`, 0 when empty
 */
export interface IssueDiscovery {
  playlist: Playlist;
  newArtists: ArtistRef[];
  artistCount: number;
  discoveryRate: number;
}

/**
 * Counts, issue by issue, the artists never seen in an earlier issue.
 * @param playlists - Any published playlists
 * @returns One row per playlist, in series order
 */
export function discoveryByIssue(
  playlists: readonly Playlist[],
): IssueDiscovery[] {
  const seen = new Set<string>();
  return seriesOrder(playlists).map((playlist) => {
    const artists = [...artistsOf(playlist).values()];
    const newArtists = artists.filter((artist) => !seen.has(artist.id));
    for (const artist of artists) seen.add(artist.id);
    return {
      playlist,
      newArtists,
      artistCount: artists.length,
      discoveryRate:
        artists.length === 0 ? 0 : newArtists.length / artists.length,
    };
  });
}

/**
 * A track that appears in more than one playlist.
 * @property track - The track, as first seen
 * @property issues - The playlists containing it, in series order
 */
export interface RepeatedTrack {
  track: Track;
  issues: Playlist[];
}

/**
 * Finds the tracks featured in several playlists.
 * @param playlists - Any published playlists
 * @returns The repeats, most repeated first
 */
export function repeatedTracks(
  playlists: readonly Playlist[],
): RepeatedTrack[] {
  const rows = new Map<string, RepeatedTrack>();
  for (const issue of seriesOrder(playlists)) {
    for (const track of issue.tracks) {
      const row = rows.get(track.id) ?? { track, issues: [] };
      if (!row.issues.includes(issue)) row.issues.push(issue);
      rows.set(track.id, row);
    }
  }
  return [...rows.values()]
    .filter((row) => row.issues.length > 1)
    .sort(
      (a, b) =>
        b.issues.length - a.issues.length ||
        a.track.title.localeCompare(b.track.title),
    );
}
