import type { ArtistProfile, ArtistRef, Playlist } from "@music/shared";

import { playlistRepository } from "@/repositories/PlaylistRepository.ts";
import { seriesOrder } from "@/services/stats";
import { sortWith } from "@/strategies/core.ts";
import { playlistSortChain } from "@/strategies/playlists.ts";

/**
 * Derived, read-only views of the catalogue shared by every page. The data
 * is bundled at build time, so this is computed once.
 * @property playlists - Every playlist, newest release first
 * @property issues - Every playlist in series order: oldest release first
 * @property latest - The newest playlist
 * @property artists - Every credited artist, by name
 * @property tags - Every configured tag, sorted
 * @property profile - Finds the profile (with image) of a top artist
 * @property neighbours - Previous and next playlist in series order
 * @property byId - Finds a playlist by id
 */
export interface Catalog {
  playlists: readonly Playlist[];
  issues: readonly Playlist[];
  latest: Playlist | undefined;
  artists: readonly ArtistRef[];
  tags: readonly string[];
  profile: (id: string) => ArtistProfile | undefined;
  neighbours: (playlist: Playlist) => { previous?: Playlist; next?: Playlist };
  byId: (id: string) => Playlist | undefined;
}

/**
 * Builds the catalogue views from the repository.
 * @returns The views
 */
function buildCatalog(): Catalog {
  const playlists = sortWith(
    playlistRepository.all(),
    ...playlistSortChain("date", "desc"),
  );
  const issues = seriesOrder(playlists);
  const artistMap = new Map<string, ArtistRef>();
  for (const track of playlists.flatMap((playlist) => playlist.tracks)) {
    for (const artist of track.artists) artistMap.set(artist.id, artist);
  }
  const profiles = new Map(
    playlistRepository.artists().map((artist) => [artist.id, artist]),
  );

  return {
    playlists,
    issues,
    latest: playlists[0],
    artists: [...artistMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "it"),
    ),
    tags: [...new Set(playlists.flatMap((playlist) => playlist.tags))].sort(),
    profile: (id) => profiles.get(id),
    neighbours: (playlist) => {
      const index = issues.findIndex((issue) => issue.id === playlist.id);
      if (index === -1) return {};
      return { previous: issues[index - 1], next: issues[index + 1] };
    },
    byId: (id) => playlistRepository.byId(id),
  };
}

let catalog: Catalog | undefined;

/**
 * Returns the shared catalogue views.
 * @returns The views
 */
export function useCatalog(): Catalog {
  catalog ??= buildCatalog();
  return catalog;
}
