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
