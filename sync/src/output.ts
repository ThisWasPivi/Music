import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type {
  ArtistProfile,
  CatalogMeta,
  Playlist,
  Rotation,
} from "@music/shared";

/** Where the web app reads its data from. */
export const DATA_DIR = fileURLToPath(
  new URL("../../music/src/data/", import.meta.url),
);

/**
 * Everything the sync publishes.
 * @property meta - Sync metadata
 * @property playlists - Published playlists
 * @property artists - Profiles of the top artists
 * @property rotation - Current listening, possibly empty
 */
export interface PublishedData {
  meta: CatalogMeta;
  playlists: Playlist[];
  artists: ArtistProfile[];
  rotation: Rotation;
}

/**
 * Writes the published JSON files, one per collection.
 * @param data - The sanitized data to publish
 * @returns Resolves once every file is written
 */
export async function writePublishedData(data: PublishedData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await Promise.all(
    Object.entries(data).map(([name, value]) =>
      writeFile(
        new URL(`${name}.json`, `file://${DATA_DIR}`),
        `${JSON.stringify(value, null, 2)}\n`,
      ),
    ),
  );
}
