/**
 * Adapter from Spotify DTOs to the published domain model. This is the only
 * module that knows the shape of Spotify's JSON.
 */
import type {
  AlbumRef,
  ArtistProfile,
  ArtistRef,
  Playlist,
  Track,
} from "@music/shared";

import {
  type ArtistDto,
  type ImageDto,
  type PlaylistItemDto,
  type SimplifiedPlaylistDto,
  type TrackDto,
  trackSchema,
} from "./spotify/schemas.ts";

/**
 * Builds the public Spotify link for a resource.
 * @param type - Resource type
 * @param id - Spotify id
 * @returns The open.spotify.com URL
 */
export function spotifyUrl(
  type: "artist" | "album" | "track" | "playlist",
  id: string,
): string {
  return `https://open.spotify.com/${type}/${encodeURIComponent(id)}`;
}

/**
 * Picks an image URL from Spotify's list.
 * @param images - The images, any order
 * @param target - "largest", or a minimum width to get the smallest image at least that wide
 * @returns The URL, or null when there are no images
 */
export function pickImage(
  images: readonly ImageDto[] | null | undefined,
  target: "largest" | number,
): string | null {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  if (target === "largest") return sorted[0]?.url ?? null;
  return (
    sorted.filter((image) => (image.width ?? 0) >= target).at(-1)?.url ??
    sorted[0]?.url ??
    null
  );
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Turns Spotify's HTML-escaped description into plain text.
 * @param value - Raw description, may contain entities and links
 * @returns Plain text
 */
export function plainDescription(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X"))
        return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
      if (code.startsWith("#"))
        return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
      return ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Reads the year of a Spotify release date ("2021", "2021-03", "2021-03-04").
 * @param releaseDate - The date string
 * @returns The year, or null when missing or zero
 */
export function releaseYearOf(
  releaseDate: string | null | undefined,
): number | null {
  const year = Number.parseInt(releaseDate?.slice(0, 4) ?? "", 10);
  return Number.isFinite(year) && year > 0 ? year : null;
}

/**
 * Maps credited artists, dropping local files' id-less artists.
 * @param artists - Simplified artists
 * @returns Artist references
 */
function adaptArtists(artists: TrackDto["artists"]): ArtistRef[] {
  return artists.flatMap((artist) =>
    artist.id
      ? [
          {
            id: artist.id,
            name: artist.name,
            url: spotifyUrl("artist", artist.id),
          },
        ]
      : [],
  );
}

/**
 * Maps a track's album.
 * @param album - The album DTO
 * @param trackId - Fallback key when the album has no id
 * @returns The album reference
 */
function adaptAlbum(album: TrackDto["album"], trackId: string): AlbumRef {
  const id = album.id ?? `unknown-${trackId}`;
  return {
    id,
    name: album.name,
    url: album.id
      ? spotifyUrl("album", album.id)
      : spotifyUrl("track", trackId),
    imageUrl: pickImage(album.images, 160),
  };
}

/**
 * Maps one playlist entry to a track.
 * @param entry - The entry from GET /playlists/{id}/items
 * @returns The track, or null for local files, episodes and unavailable items
 */
export function adaptPlaylistItem(entry: PlaylistItemDto): Track | null {
  const item = entry.item ?? entry.track;
  if (!item || item.type !== "track" || entry.is_local || !entry.added_at)
    return null;
  const parsed = trackSchema.safeParse(item);
  if (!parsed.success) return null;
  const track = parsed.data;
  if (!track.id || track.is_local) return null;

  return {
    id: track.id,
    title: track.name,
    artists: adaptArtists(track.artists),
    album: adaptAlbum(track.album, track.id),
    releaseYear: releaseYearOf(track.album.release_date),
    durationMs: Math.round(track.duration_ms),
    explicit: track.explicit,
    addedAt: new Date(entry.added_at).toISOString(),
    url: spotifyUrl("track", track.id),
  };
}

/**
 * Extra data the adapter cannot derive from the DTOs.
 * @property number - Issue number parsed from the name
 * @property tags - Configured moods
 * @property palette - Cover colours extracted at sync time
 */
export interface PlaylistExtras {
  number: number | null;
  tags: string[];
  palette: string[];
}

/**
 * Maps a playlist and its entries to the domain model.
 * @param playlist - The listed playlist
 * @param entries - Its entries
 * @param extras - Number, tags and palette
 * @returns The domain playlist; totals and dates are computed from the kept tracks
 */
export function adaptPlaylist(
  playlist: SimplifiedPlaylistDto,
  entries: readonly PlaylistItemDto[],
  extras: PlaylistExtras,
): Playlist {
  const tracks = entries
    .map(adaptPlaylistItem)
    .filter((track): track is Track => track !== null);
  const added = tracks.map((track) => track.addedAt).sort();
  return {
    id: playlist.id,
    name: playlist.name.normalize("NFC"),
    number: extras.number,
    description: plainDescription(playlist.description),
    coverUrl: pickImage(playlist.images, "largest"),
    url: spotifyUrl("playlist", playlist.id),
    trackCount: tracks.length,
    durationMs: tracks.reduce((sum, track) => sum + track.durationMs, 0),
    firstAddedAt: added[0] ?? null,
    lastAddedAt: added.at(-1) ?? null,
    palette: extras.palette,
    tags: extras.tags,
    tracks,
  };
}

/**
 * Maps a full artist.
 * @param artist - The artist DTO
 * @returns The profile, or null when the artist has no id
 */
export function adaptArtist(artist: ArtistDto): ArtistProfile | null {
  if (!artist.id) return null;
  return {
    id: artist.id,
    name: artist.name,
    url: spotifyUrl("artist", artist.id),
    imageUrl: pickImage(artist.images, 160),
  };
}

/**
 * Maps a top track for the rotation section.
 * @param track - The track DTO
 * @returns The trimmed track, or null for local files
 */
export function adaptTopTrack(
  track: TrackDto,
): Pick<Track, "id" | "title" | "artists" | "album" | "url"> | null {
  if (!track.id) return null;
  return {
    id: track.id,
    title: track.name,
    artists: adaptArtists(track.artists),
    album: adaptAlbum(track.album, track.id),
    url: spotifyUrl("track", track.id),
  };
}
