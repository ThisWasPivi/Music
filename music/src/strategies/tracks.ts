import type { Track } from "@music/shared";

import { fuzzyMatches } from "@/utils/fuzzy.ts";

import {
  compareNullableNumbers,
  type FilterStrategy,
  type SortStrategy,
} from "./core.ts";

/** Alphabetical by title. */
export const byTitle: SortStrategy<Track> = {
  id: "title",
  labelKey: "tracks.title",
  compare: (a, b) => a.title.localeCompare(b.title, "en"),
};

/** Alphabetical by the first credited artist. */
export const byArtist: SortStrategy<Track> = {
  id: "artist",
  labelKey: "tracks.artist",
  compare: (a, b) =>
    (a.artists[0]?.name ?? "").localeCompare(b.artists[0]?.name ?? "", "en"),
};

/** Alphabetical by album. */
export const byAlbum: SortStrategy<Track> = {
  id: "album",
  labelKey: "tracks.album",
  compare: (a, b) => a.album.name.localeCompare(b.album.name, "en"),
};

/** Ascending by release year, unknown years last. */
export const byYear: SortStrategy<Track> = {
  id: "year",
  labelKey: "tracks.year",
  compare: (a, b) => compareNullableNumbers(a.releaseYear, b.releaseYear),
};

/** Ascending by length. */
export const byTrackDuration: SortStrategy<Track> = {
  id: "duration",
  labelKey: "tracks.duration",
  compare: (a, b) => a.durationMs - b.durationMs,
};

/** Ascending by when the track was added. */
export const byAddedAt: SortStrategy<Track> = {
  id: "added",
  labelKey: "tracks.added",
  compare: (a, b) => a.addedAt.localeCompare(b.addedAt),
};

/** Every track sort the UI offers. */
export const TRACK_SORTS = [
  byTitle,
  byArtist,
  byAlbum,
  byYear,
  byTrackDuration,
  byAddedAt,
] as const;

/** Identifier of a track sort. */
export type TrackSortId = (typeof TRACK_SORTS)[number]["id"];

/**
 * Fuzzy-matches tracks by title, artists or album.
 * @param query - Free text; blank matches everything
 * @returns The filter
 */
export function trackTextFilter(query: string): FilterStrategy<Track> {
  return {
    id: "text",
    test: (track) =>
      fuzzyMatches(
        query,
        track.title,
        track.album.name,
        ...track.artists.map((artist) => artist.name),
      ),
  };
}
