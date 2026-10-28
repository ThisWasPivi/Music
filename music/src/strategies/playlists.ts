import type { Playlist } from "@music/shared";

import { colorSortKey } from "@/utils/color.ts";
import { fuzzyMatches } from "@/utils/fuzzy.ts";

import {
  compareNullableNumbers,
  type FilterStrategy,
  type SortDirection,
  type SortStrategy,
  withDirection,
} from "./core.ts";

/** Playlists without tracks, so without a date, sink to the bottom whatever the direction. */
export const undatedLast: SortStrategy<Playlist> = {
  id: "undated-last",
  labelKey: "sort.date",
  compare: (a, b) =>
    Number(a.firstAddedAt === null) - Number(b.firstAddedAt === null),
};

/** Oldest release first: the release date is the first track's `added_at`. */
export const byDate: SortStrategy<Playlist> = {
  id: "date",
  labelKey: "sort.date",
  compare: (a, b) => (a.firstAddedAt ?? "").localeCompare(b.firstAddedAt ?? ""),
};

/** Ascending by the number in the name, as a tie-breaker. */
export const byNumber: SortStrategy<Playlist> = {
  id: "number",
  labelKey: "sort.date",
  compare: (a, b) => compareNullableNumbers(a.number, b.number),
};

/** Alphabetical by name, numbers compared as numbers and "#" ignored. */
export const byName: SortStrategy<Playlist> = {
  id: "name",
  labelKey: "sort.name",
  compare: (a, b) =>
    a.name.localeCompare(b.name, "en", {
      numeric: true,
      ignorePunctuation: true,
    }),
};

/** Ascending by track count. */
export const byTrackCount: SortStrategy<Playlist> = {
  id: "tracks",
  labelKey: "sort.tracks",
  compare: (a, b) => a.trackCount - b.trackCount,
};

/** Ascending by total duration. */
export const byDuration: SortStrategy<Playlist> = {
  id: "duration",
  labelKey: "sort.duration",
  compare: (a, b) => a.durationMs - b.durationMs,
};

/** Along the rainbow by the dominant cover colour, greys last. */
export const byColor: SortStrategy<Playlist> = {
  id: "color",
  labelKey: "sort.color",
  compare: (a, b) =>
    colorSortKey(a.palette[0] ?? "#000000") -
    colorSortKey(b.palette[0] ?? "#000000"),
};

/** Every playlist sort the UI offers, with its natural direction. */
export const PLAYLIST_SORTS = [
  { strategy: byDate, defaultDirection: "desc" },
  { strategy: byName, defaultDirection: "asc" },
  { strategy: byTrackCount, defaultDirection: "desc" },
  { strategy: byDuration, defaultDirection: "desc" },
  { strategy: byColor, defaultDirection: "asc" },
] as const satisfies readonly {
  strategy: SortStrategy<Playlist>;
  defaultDirection: SortDirection;
}[];

/** Identifier of a playlist sort. */
export type PlaylistSortId = (typeof PLAYLIST_SORTS)[number]["strategy"]["id"];

/**
 * Resolves the chain of strategies for a UI sort choice.
 * @param id - The chosen sort
 * @param direction - The chosen direction
 * @returns The strategies to pass to `sortWith`, date then number as tie-breakers
 */
export function playlistSortChain(
  id: PlaylistSortId,
  direction: SortDirection,
): SortStrategy<Playlist>[] {
  const entry =
    PLAYLIST_SORTS.find((sort) => sort.strategy.id === id) ?? PLAYLIST_SORTS[0];
  return [
    undatedLast,
    withDirection(entry.strategy, direction),
    withDirection(byDate, "desc"),
    withDirection(byNumber, "desc"),
  ];
}

/**
 * Fuzzy-matches playlists by name, description, tags, tracks, albums or artists.
 * @param query - Free text; blank matches everything
 * @returns The filter
 */
export function textFilter(query: string): FilterStrategy<Playlist> {
  return {
    id: "text",
    test: (playlist) =>
      fuzzyMatches(
        query,
        playlist.name,
        playlist.description,
        ...playlist.tags,
        ...playlist.tracks.flatMap((track) => [
          track.title,
          track.album.name,
          ...track.artists.map((artist) => artist.name),
        ]),
      ),
  };
}

/**
 * Matches playlists featuring an artist.
 * @param artistId - The artist's id
 * @returns The filter
 */
export function artistFilter(artistId: string): FilterStrategy<Playlist> {
  return {
    id: "artist",
    test: (playlist) =>
      playlist.tracks.some((track) =>
        track.artists.some((artist) => artist.id === artistId),
      ),
  };
}

/**
 * Matches playlists with at least one track released in a decade.
 * @param decade - The decade's first year, e.g. 1990
 * @returns The filter
 */
export function decadeFilter(decade: number): FilterStrategy<Playlist> {
  return {
    id: "decade",
    test: (playlist) =>
      playlist.tracks.some(
        (track) =>
          track.releaseYear !== null &&
          track.releaseYear >= decade &&
          track.releaseYear < decade + 10,
      ),
  };
}

/**
 * Matches playlists carrying a tag.
 * @param tag - The tag
 * @returns The filter
 */
export function tagFilter(tag: string): FilterStrategy<Playlist> {
  return { id: "tag", test: (playlist) => playlist.tags.includes(tag) };
}
