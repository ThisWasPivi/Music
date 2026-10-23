import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Default cache folder, gitignored. */
export const CACHE_DIR = fileURLToPath(
  new URL("../../../.sync-cache/", import.meta.url),
);

/**
 * A key-value store for API responses.
 * @property get - Returns a fresh cached value, or undefined
 * @property set - Stores a value
 */
export interface ResponseCache {
  get: (key: string, maxAgeMs: number) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
}

/**
 * A cache entry as stored on disk.
 * @property storedAt - Epoch milliseconds of the write
 * @property value - The cached JSON
 */
interface Entry {
  storedAt: number;
  value: unknown;
}

/**
 * Creates a cache that keeps one JSON file per key.
 * @param dir - Folder to write into
 * @param now - Clock, swappable in tests
 * @returns The cache
 */
export function createDiskCache(
  dir: string = CACHE_DIR,
  now: () => number = Date.now,
): ResponseCache {
  /**
   * Maps a key to its file.
   * @param key - Cache key
   * @returns The file path
   */
  const fileOf = (key: string): string =>
    join(
      dir,
      `${createHash("sha256").update(key).digest("hex").slice(0, 32)}.json`,
    );

  return {
    async get(key, maxAgeMs) {
      try {
        const entry = JSON.parse(await readFile(fileOf(key), "utf8")) as Entry;
        return now() - entry.storedAt <= maxAgeMs ? entry.value : undefined;
      } catch {
        return undefined;
      }
    },
    async set(key, value) {
      await mkdir(dir, { recursive: true });
      const entry: Entry = { storedAt: now(), value };
      await writeFile(fileOf(key), JSON.stringify(entry));
    },
  };
}

/** A cache that stores nothing, for `--no-cache` runs and tests. */
export const noCache: ResponseCache = {
  get: async () => undefined,
  set: async () => undefined,
};
