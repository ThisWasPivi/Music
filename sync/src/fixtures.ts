/*
 * Writes the invented sample catalogue into the app's data folder, so the app
 * can be developed without a Spotify login. `pnpm sync` overwrites it.
 */
import { createFixtureCatalog } from "@music/shared/fixtures";

import { writePublishedData } from "./output.ts";

const catalog = createFixtureCatalog();
await writePublishedData({
  meta: { generatedAt: "2026-01-01T00:00:00.000Z", source: "fixtures" },
  ...catalog,
});
console.log(`Wrote ${catalog.playlists.length} sample playlists.`);
