/**
 * DTOs of the Spotify Web API, as of the 2026 Development Mode changes.
 *
 * Schemas only declare the fields the sync uses and are lenient about the
 * rest: `z.object` drops unknown keys, so a field Spotify adds never breaks
 * the sync, and a field it removes surfaces as a clear validation error.
 */
import { z } from "zod";

const externalUrls = z.object({ spotify: z.string().optional() }).partial();

/** One entry of an `images` array. */
export const imageSchema = z.object({
  url: z.string(),
  width: z.number().nullish(),
  height: z.number().nullish(),
});

/** A Spotify image. */
export type ImageDto = z.infer<typeof imageSchema>;

const images = z.array(imageSchema).nullish();

/**
 * Wraps an item schema in Spotify's paging envelope.
 * @param item - Schema of one page item
 * @returns The paging schema
 */
export function pagingSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    next: z.string().nullish(),
    total: z.number().optional(),
  });
}

/**
 * `GET /me`: the id checks playlist ownership; id and name feed the
 * sanitizer's leak check. Neither is ever published.
 */
export const currentUserSchema = z.object({
  id: z.string(),
  display_name: z.string().nullish(),
});

/** A simplified artist, as credited on tracks. */
export const simplifiedArtistSchema = z.object({
  id: z.string().nullish(),
  name: z.string(),
  external_urls: externalUrls.optional(),
});

/** `GET /artists/{id}` and `/me/top/artists` entries. */
export const artistSchema = simplifiedArtistSchema.extend({ images });

/** A Spotify artist with images. */
export type ArtistDto = z.infer<typeof artistSchema>;

/** A simplified album, as embedded in tracks. */
export const albumSchema = z.object({
  id: z.string().nullish(),
  name: z.string(),
  release_date: z.string().nullish(),
  images,
  external_urls: externalUrls.optional(),
});

/** A full track object. */
export const trackSchema = z.object({
  type: z.literal("track"),
  id: z.string().nullish(),
  name: z.string(),
  artists: z.array(simplifiedArtistSchema),
  album: albumSchema,
  duration_ms: z.number(),
  explicit: z.boolean().optional().default(false),
  is_local: z.boolean().optional(),
  external_urls: externalUrls.optional(),
});

/** A Spotify track. */
export type TrackDto = z.infer<typeof trackSchema>;

/** Anything that is not a track (podcast episodes), kept only to be skipped. */
const otherItemSchema = z.object({ type: z.string() });

/**
 * One entry of `GET /playlists/{id}/items`. The playable lives in `item`;
 * `track` is the pre-2026 name, accepted for robustness. `added_by` is read
 * only so the sanitizer knows which collaborator ids must never be
 * published; the adapter does not map it.
 */
export const playlistItemSchema = z.object({
  added_at: z.string().nullish(),
  added_by: z.object({ id: z.string() }).nullish(),
  is_local: z.boolean().optional(),
  item: z.union([trackSchema, otherItemSchema]).nullish(),
  track: z.union([trackSchema, otherItemSchema]).nullish(),
});

/** A playlist entry. */
export type PlaylistItemDto = z.infer<typeof playlistItemSchema>;

/** A playlist as listed by `GET /me/playlists`. */
export const simplifiedPlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  images,
  external_urls: externalUrls.optional(),
  owner: z.object({ id: z.string() }),
  snapshot_id: z.string().optional(),
  items: z.object({ total: z.number() }).nullish(),
  tracks: z.object({ total: z.number() }).nullish(),
});

/** A listed playlist. */
export type SimplifiedPlaylistDto = z.infer<typeof simplifiedPlaylistSchema>;

/** Token endpoint response. */
export const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

/** Token endpoint error body. */
export const tokenErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
});
