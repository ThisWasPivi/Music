import type { ArtistRef, Playlist } from "@music/shared";

/**
 * Collects the distinct artists credited on a playlist.
 * @param playlist - The playlist
 * @returns Artists keyed by id
 */
export function artistsOf(playlist: Playlist): Map<string, ArtistRef> {
  const artists = new Map<string, ArtistRef>();
  for (const track of playlist.tracks) {
    for (const artist of track.artists) artists.set(artist.id, artist);
  }
  return artists;
}

/**
 * Jaccard similarity of two sets: |A ∩ B| / |A ∪ B|.
 * @param a - First set
 * @param b - Second set
 * @returns The similarity in [0, 1]; two empty sets count as 0
 */
export function jaccard(
  a: ReadonlySet<string>,
  b: ReadonlySet<string>,
): number {
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

/**
 * Pairwise artist overlap between playlists.
 * @property playlists - Row and column order
 * @property values - `values[i][j]` is the similarity of playlists i and j
 */
export interface OverlapMatrix {
  playlists: readonly Playlist[];
  values: number[][];
}

/**
 * Computes the Jaccard similarity of the artist sets of every playlist pair.
 * @param playlists - The playlists, in display order
 * @returns The symmetric matrix, with 1 on the diagonal of non-empty playlists
 */
export function artistOverlapMatrix(
  playlists: readonly Playlist[],
): OverlapMatrix {
  const sets = playlists.map((playlist) => new Set(artistsOf(playlist).keys()));
  const values = sets.map((row) => sets.map((column) => jaccard(row, column)));
  return { playlists, values };
}

/**
 * Lists the artists two playlists have in common.
 * @param a - First playlist
 * @param b - Second playlist
 * @returns The shared artists, sorted by name
 */
export function sharedArtists(a: Playlist, b: Playlist): ArtistRef[] {
  const right = artistsOf(b);
  return [...artistsOf(a).values()]
    .filter((artist) => right.has(artist.id))
    .sort((x, y) => x.name.localeCompare(y.name));
}
