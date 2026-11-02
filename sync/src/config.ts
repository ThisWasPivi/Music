import { SERIES_PREFIX } from "@music/shared";
import { z } from "zod";

const configSchema = z.object({
  prefix: z.string().min(1).default(SERIES_PREFIX),
  include: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  tags: z.record(z.string(), z.array(z.string())).default({}),
  artistImages: z.number().int().min(0).nullable().default(null),
  rotation: z.boolean().default(true),
});

/**
 * Which playlists to publish and how.
 * @property prefix - Series prefix matched against names (NFC, case-insensitive)
 * @property include - Extra playlist ids to publish even if the name does not match
 * @property exclude - Playlist ids never to publish
 * @property tags - Optional moods per playlist id
 * @property artistImages - How many artists, most credited first, get a picture via
 *   GET /artists/{id}; null fetches every credited artist (cached for 30 days)
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
