import type { ArtistRef, Playlist, Track } from "@music/shared";

/**
 * Builds a credited artist for tests.
 * @param id - Artist id, also used as the name
 * @returns The artist reference
 */
export function artist(id: string): ArtistRef {
  return { id, name: id, url: `https://open.spotify.com/artist/${id}` };
}

/**
 * Builds a track for tests, with sensible defaults.
 * @param overrides - Fields to set; `artists` may be given as ids
 * @returns The track
 */
export function track(
  overrides: Partial<Omit<Track, "artists">> & { artists?: string[] } = {},
): Track {
  const { artists = ["a"], ...rest } = overrides;
  const id = rest.id ?? "t";
  return {
    id,
    title: id,
    album: { id: `al-${id}`, name: `Album ${id}`, url: "", imageUrl: null },
    releaseYear: 2020,
    durationMs: 180_000,
    explicit: false,
    addedAt: "2024-01-01T10:00:00.000Z",
    url: "",
    ...rest,
    artists: artists.map(artist),
  };
}

/**
 * Builds a playlist for tests; totals are derived from the tracks.
 * @param overrides - Fields to set
 * @returns The playlist
 */
export function playlist(overrides: Partial<Playlist> = {}): Playlist {
  const tracks = overrides.tracks ?? [];
  const added = tracks.map((entry) => entry.addedAt).sort();
  return {
    id: `pl-${overrides.number ?? "x"}`,
    name: `Pivəəkly ${overrides.number ?? ""}`.trim(),
    number: null,
    description: "",
    coverUrl: null,
    url: "",
    trackCount: tracks.length,
    durationMs: tracks.reduce((sum, entry) => sum + entry.durationMs, 0),
    firstAddedAt: added[0] ?? null,
    lastAddedAt: added.at(-1) ?? null,
    palette: ["#000000"],
    tags: [],
    tracks,
    ...overrides,
  };
}
