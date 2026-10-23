import type { Track } from "@music/shared";

import {
  compareNullableNumbers,
  type FilterStrategy,
  searchable,
  type SortStrategy,
} from "./core.ts";

/** Alphabetical by title. */
export const byTitle: SortStrategy<Track> = {
  id: "title",
  label: "Titolo",
  compare: (a, b) => a.title.localeCompare(b.title, "it"),
};

/** Alphabetical by the first credited artist. */
export const byArtist: SortStrategy<Track> = {
  id: "artist",
  label: "Artista",
  compare: (a, b) =>
    (a.artists[0]?.name ?? "").localeCompare(b.artists[0]?.name ?? "", "it"),
};

/** Alphabetical by album. */
export const byAlbum: SortStrategy<Track> = {
  id: "album",
  label: "Album",
  compare: (a, b) => a.album.name.localeCompare(b.album.name, "it"),
};

/** Ascending by release year, unknown years last. */
export const byYear: SortStrategy<Track> = {
  id: "year",
  label: "Anno",
  compare: (a, b) => compareNullableNumbers(a.releaseYear, b.releaseYear),
};

/** Ascending by length. */
export const byTrackDuration: SortStrategy<Track> = {
  id: "duration",
  label: "Durata",
  compare: (a, b) => a.durationMs - b.durationMs,
};

/** Ascending by when the track was added. */
export const byAddedAt: SortStrategy<Track> = {
  id: "added",
  label: "Aggiunto il",
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
 * Matches tracks whose title, artists or album contain the text.
 * @param query - Free text; blank matches everything
 * @returns The filter
 */
export function trackTextFilter(query: string): FilterStrategy<Track> {
  const needle = searchable(query.trim());
  return {
    id: "text",
    test: (track) =>
      needle === "" ||
      [
        track.title,
        track.album.name,
        ...track.artists.map((artist) => artist.name),
      ].some((value) => searchable(value).includes(needle)),
  };
}
