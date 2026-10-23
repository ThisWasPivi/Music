/**
 * Runtime schemas of the published domain model.
 *
 * `z.object` strips every key it does not declare, so parsing through these
 * schemas is a whitelist: whatever the sync accidentally carries along
 * (`added_by`, owners, user ids) cannot survive into the published JSON.
 */
import { z } from "zod";

import type {
  AlbumRef,
  ArtistProfile,
  ArtistRef,
  CatalogMeta,
  Playlist,
  Rotation,
  Track,
} from "./domain.ts";

const isoDate = z.iso.datetime({ offset: true });
const spotifyUrl = z.url({
  protocol: /^https$/,
  hostname: /^open\.spotify\.com$/,
});
const imageUrl = z.union([
  z.url({ protocol: /^https$/ }),
  z.string().startsWith("data:image/svg+xml,"),
]);

/** Schema of {@link ArtistRef}. */
export const artistRefSchema: z.ZodType<ArtistRef> = z.object({
  id: z.string().min(1),
  name: z.string(),
  url: spotifyUrl,
});

/** Schema of {@link AlbumRef}. */
export const albumRefSchema: z.ZodType<AlbumRef> = z.object({
  id: z.string().min(1),
  name: z.string(),
  url: spotifyUrl,
  imageUrl: imageUrl.nullable(),
});

/** Schema of {@link Track}. */
export const trackSchema: z.ZodType<Track> = z.object({
  id: z.string().min(1),
  title: z.string(),
  artists: z.array(artistRefSchema),
  album: albumRefSchema,
  releaseYear: z.number().int().nullable(),
  durationMs: z.number().int().nonnegative(),
  explicit: z.boolean(),
  addedAt: isoDate,
  url: spotifyUrl,
});

/** Schema of {@link Playlist}. */
export const playlistSchema: z.ZodType<Playlist> = z.object({
  id: z.string().min(1),
  name: z.string(),
  number: z.number().int().positive().nullable(),
  description: z.string(),
  coverUrl: imageUrl.nullable(),
  url: spotifyUrl,
  trackCount: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  firstAddedAt: isoDate.nullable(),
  lastAddedAt: isoDate.nullable(),
  palette: z.array(z.string().regex(/^#[\da-f]{6}$/i)),
  tags: z.array(z.string()),
  tracks: z.array(trackSchema),
});

/** Schema of {@link ArtistProfile}. */
export const artistProfileSchema: z.ZodType<ArtistProfile> = z.object({
  id: z.string().min(1),
  name: z.string(),
  url: spotifyUrl,
  imageUrl: imageUrl.nullable(),
});

/** Schema of {@link Rotation}. */
export const rotationSchema: z.ZodType<Rotation> = z.object({
  artists: z.array(artistProfileSchema),
  tracks: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string(),
      artists: z.array(artistRefSchema),
      album: albumRefSchema,
      url: spotifyUrl,
    }),
  ),
});

/** Schema of {@link CatalogMeta}. */
export const catalogMetaSchema: z.ZodType<CatalogMeta> = z.object({
  generatedAt: isoDate,
  source: z.enum(["spotify", "fixtures"]),
});
