/*
 * `pnpm sync`: downloads the series playlists from Spotify and writes the
 * sanitized JSON the site is built from.
 */
import config from "../playlists.config.ts";
import { loadEnv } from "./env.ts";
import { SyncError } from "./errors.ts";
import { DATA_DIR, writePublishedData } from "./output.ts";
import { paletteFromUrl } from "./palette.ts";
import { createDiskCache, noCache } from "./spotify/cache.ts";
import { SpotifyClient } from "./spotify/client.ts";
import { runSync } from "./sync.ts";
import { createTokenProvider } from "./token.ts";

const useCache = !process.argv.includes("--no-cache");

try {
  const env = await loadEnv();
  const cache = useCache ? createDiskCache() : noCache;
  const client = new SpotifyClient({
    getToken: createTokenProvider(env),
    cache,
    log: (message) => console.log(`  … ${message}`),
  });
  const data = await runSync({
    client,
    cache,
    config,
    palette: (url) => paletteFromUrl(url),
    log: (line) => console.log(line),
  });
  await writePublishedData(data);
  const tracks = data.playlists.reduce(
    (sum, playlist) => sum + playlist.trackCount,
    0,
  );
  console.log(
    `\nWrote ${data.playlists.length} playlists, ${tracks} tracks, ${data.artists.length} artists to ${DATA_DIR}`,
  );
} catch (error) {
  if (error instanceof SyncError) {
    console.error(`\n✗ ${error.message}`);
    process.exit(1);
  }
  throw error;
}
