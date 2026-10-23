import { SERIES_PREFIX } from "@music/shared";
import { z } from "zod";

const configSchema = z.object({
  prefix: z.string().min(1).default(SERIES_PREFIX),
  include: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  tags: z.record(z.string(), z.array(z.string())).default({}),
  topArtistCount: z.number().int().min(0).max(50).default(30),
  rotation: z.boolean().default(true),
});

/**
 * Which playlists to publish and how.
 * @property prefix - Series prefix matched against names (NFC, case-insensitive)
 * @property include - Extra playlist ids to publish even if the name does not match
 * @property exclude - Playlist ids never to publish
 * @property tags - Optional moods per playlist id
 * @property topArtistCount - Artists to enrich with an image via GET /artists/{id}
 * @property rotation - Whether to fetch the "in rotation" top artists and tracks
 */
export type SyncConfig = z.infer<typeof configSchema>;

/**
 * Validates a config and fills in defaults.
 * @param input - The authored config
 * @returns The complete config
 */
export function defineConfig(input: z.input<typeof configSchema>): SyncConfig {
  return configSchema.parse(input);
}
