import type {
  PlaylistItemDto,
  SimplifiedPlaylistDto,
  TrackDto,
} from "../spotify/schemas.ts";

/**
 * Builds a Spotify track DTO for tests.
 * @param id - Track id
 * @param overrides - Fields to change
 * @returns The DTO
 */
export function trackDto(
  id: string,
  overrides: Partial<TrackDto> = {},
): TrackDto {
  return {
    type: "track",
    id,
    name: `Song ${id}`,
    artists: [
      { id: `ar-${id}`, name: `Artist ${id}`, external_urls: { spotify: "x" } },
    ],
    album: {
      id: `al-${id}`,
      name: `Album ${id}`,
      release_date: "1999-05-01",
      images: [
        { url: "https://i.scdn.co/image/large", width: 640, height: 640 },
        { url: "https://i.scdn.co/image/medium", width: 300, height: 300 },
        { url: "https://i.scdn.co/image/small", width: 64, height: 64 },
      ],
    },
    duration_ms: 200_000,
    explicit: false,
    ...overrides,
  };
}

/**
 * Builds a playlist entry DTO, in the 2026 shape (`item`).
 * @param track - The track, or another item
 * @param addedAt - When it was added
 * @returns The entry, including an `added_by` collaborator
 */
export function itemDto(
  track: PlaylistItemDto["item"],
  addedAt = "2024-02-01T10:00:00Z",
): PlaylistItemDto {
  return {
    added_at: addedAt,
    added_by: { id: "collab-user" },
    is_local: false,
    item: track,
  };
}

/**
 * Builds a listed playlist DTO.
 * @param id - Playlist id
 * @param name - Playlist name
 * @param ownerId - Owner id
 * @returns The DTO
 */
export function playlistDto(
  id: string,
  name: string,
  ownerId = "me-user",
): SimplifiedPlaylistDto {
  return {
    id,
    name,
    description:
      'Issue &amp; friends &#x27;24 <a href="spotify:artist:1">link</a>',
    images: [
      { url: "https://mosaic.scdn.co/640/abc", width: 640, height: 640 },
    ],
    owner: { id: ownerId },
    snapshot_id: `snap-${id}`,
    items: { total: 1 },
  };
}
