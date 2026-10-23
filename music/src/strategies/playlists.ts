import type { Playlist } from "@music/shared";

import { colorSortKey } from "@/utils/color.ts";

import {
  compareNullableNumbers,
  type FilterStrategy,
  searchable,
  type SortDirection,
  type SortStrategy,
  withDirection,
} from "./core.ts";

/** Unnumbered playlists always sink to the bottom, whatever the direction. */
export const unnumberedLast: SortStrategy<Playlist> = {
  id: "unnumbered-last",
  label: "Fuori serie in fondo",
  compare: (a, b) => Number(a.number === null) - Number(b.number === null),
};

/** Ascending by issue number. */
export const byNumber: SortStrategy<Playlist> = {
  id: "number",
  label: "Numero",
  compare: (a, b) => compareNullableNumbers(a.number, b.number),
};

/** Alphabetical by name. */
export const byName: SortStrategy<Playlist> = {
  id: "name",
  label: "Nome",
  compare: (a, b) =>
    a.name.localeCompare(b.name, "it", {
      numeric: true,
      ignorePunctuation: true,
    }),
};

/** Ascending by track count. */
export const byTrackCount: SortStrategy<Playlist> = {
  id: "tracks",
  label: "Numero brani",
  compare: (a, b) => a.trackCount - b.trackCount,
};

/** Ascending by total duration. */
export const byDuration: SortStrategy<Playlist> = {
  id: "duration",
  label: "Durata",
  compare: (a, b) => a.durationMs - b.durationMs,
};

/** Ascending by the latest `added_at`. */
export const byLastUpdate: SortStrategy<Playlist> = {
  id: "updated",
  label: "Ultimo aggiornamento",
  compare: (a, b) => (a.lastAddedAt ?? "").localeCompare(b.lastAddedAt ?? ""),
};

/** Along the rainbow by the dominant cover colour, greys last. */
export const byColor: SortStrategy<Playlist> = {
  id: "color",
  label: "Colore",
  compare: (a, b) =>
    colorSortKey(a.palette[0] ?? "#000000") -
    colorSortKey(b.palette[0] ?? "#000000"),
};

/** Every playlist sort the UI offers, with its natural direction. */
export const PLAYLIST_SORTS = [
  { strategy: byNumber, defaultDirection: "desc" },
  { strategy: byName, defaultDirection: "asc" },
  { strategy: byTrackCount, defaultDirection: "desc" },
  { strategy: byDuration, defaultDirection: "desc" },
  { strategy: byLastUpdate, defaultDirection: "desc" },
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
 * @returns The strategies to pass to `sortWith`, number as the tie-breaker
 */
export function playlistSortChain(
  id: PlaylistSortId,
  direction: SortDirection,
): SortStrategy<Playlist>[] {
  const entry =
    PLAYLIST_SORTS.find((sort) => sort.strategy.id === id) ?? PLAYLIST_SORTS[0];
  return [
    unnumberedLast,
    withDirection(entry.strategy, direction),
    withDirection(byNumber, "desc"),
  ];
}

/**
 * Matches playlists whose name, description, tags, tracks or artists contain the text.
 * @param query - Free text; blank matches everything
 * @returns The filter
 */
export function textFilter(query: string): FilterStrategy<Playlist> {
  const needle = searchable(query.trim());
  return {
    id: "text",
    test: (playlist) =>
      needle === "" ||
      [
        playlist.name,
        playlist.description,
        ...playlist.tags,
        ...playlist.tracks.flatMap((track) => [
          track.title,
          track.album.name,
          ...track.artists.map((artist) => artist.name),
        ]),
      ].some((value) => searchable(value).includes(needle)),
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
