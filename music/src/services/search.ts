import type { ArtistProfile, ArtistRef, Playlist } from "@music/shared";

import { fuzzyScore } from "@/utils/fuzzy.ts";

/** What a search result points at. */
export type SearchKind = "playlist" | "artist" | "album" | "track";

/**
 * One searchable thing.
 * @property kind - Playlist, artist, album or track
 * @property id - Unique within its kind
 * @property title - Main line
 * @property subtitle - Secondary line: artists, or where it appears
 * @property image - Cover or picture
 * @property playlistId - Playlist to open (the newest featuring it); for
 *   artists, null and the artist page opens instead
 * @property texts - What the query is matched against
 */
export interface SearchEntry {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  playlistId: string | null;
  texts: string[];
}

/**
 * Results of one kind.
 * @property kind - The kind
 * @property entries - Best matches first
 */
export interface SearchGroup {
  kind: SearchKind;
  entries: SearchEntry[];
}

/**
 * Builds the index of everything the search palette can find. Albums and
 * tracks appear once even when several playlists feature them, and lead
 * to the newest one.
 * @param playlists - Every playlist, newest first
 * @param artists - Every credited artist
 * @param profile - Finds an artist's picture
 * @returns The index
 */
export function buildSearchIndex(
  playlists: readonly Playlist[],
  artists: readonly ArtistRef[],
  profile: (id: string) => ArtistProfile | undefined,
): SearchEntry[] {
  const entries: SearchEntry[] = playlists.map((playlist) => ({
    kind: "playlist",
    id: playlist.id,
    title: playlist.name,
    subtitle: playlist.description,
    image: playlist.coverUrl,
    playlistId: playlist.id,
    texts: [playlist.name, playlist.description, ...playlist.tags],
  }));

  for (const artist of artists) {
    entries.push({
      kind: "artist",
      id: artist.id,
      title: artist.name,
      subtitle: "",
      image: profile(artist.id)?.imageUrl ?? null,
      playlistId: null,
      texts: [artist.name],
    });
  }

  const albums = new Set<string>();
  const tracks = new Set<string>();
  for (const playlist of playlists) {
    for (const track of playlist.tracks) {
      const credits = track.artists.map((artist) => artist.name).join(", ");
      if (!albums.has(track.album.id)) {
        albums.add(track.album.id);
        entries.push({
          kind: "album",
          id: track.album.id,
          title: track.album.name,
          subtitle: credits,
          image: track.album.imageUrl,
          playlistId: playlist.id,
          texts: [track.album.name, credits],
        });
      }
      if (!tracks.has(track.id)) {
        tracks.add(track.id);
        entries.push({
          kind: "track",
          id: track.id,
          title: track.title,
          subtitle: credits,
          image: track.album.imageUrl,
          playlistId: playlist.id,
          texts: [track.title, credits, track.album.name],
        });
      }
    }
  }
  return entries;
}

/** Order of the groups in the results. */
const KINDS: readonly SearchKind[] = ["playlist", "artist", "album", "track"];

/**
 * Searches the index, keeping the best few matches of each kind.
 * @param index - The index
 * @param query - What the user typed
 * @param perGroup - Most results per kind
 * @returns Non-empty groups, in a fixed order; none for a blank query
 */
export function searchIndex(
  index: readonly SearchEntry[],
  query: string,
  perGroup = 5,
): SearchGroup[] {
  if (query.trim() === "") return [];
  const scored = index.flatMap((entry, position) => {
    const score = fuzzyScore(query, ...entry.texts);
    return score === null ? [] : [{ entry, score, position }];
  });
  return KINDS.map((kind) => ({
    kind,
    entries: scored
      .filter((row) => row.entry.kind === kind)
      .sort((a, b) => b.score - a.score || a.position - b.position)
      .slice(0, perGroup)
      .map((row) => row.entry),
  })).filter((group) => group.entries.length > 0);
}
