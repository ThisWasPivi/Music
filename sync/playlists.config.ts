import { site } from "../site.config.ts";
import { defineConfig } from "./src/config.ts";

/**
 * Publication rules: which of your playlists the site publishes.
 *
 * Only playlists you own whose name starts with `prefix` are published
 * (compared NFC-normalized and case-insensitive; note the two "ə", U+0259).
 * Every sync prints which playlists were included or skipped, and why.
 */
export default defineConfig({
  /* The series name from site.config.ts; any other prefix works too. */
  prefix: site.series,

  /* Playlist ids to publish even though their name does not match. */
  include: [],

  /* Playlist ids never to publish, whatever their name. */
  exclude: [],

  /* Optional moods per playlist id, e.g. { "37i9dQZF1DX...": ["chill", "night"] }. */
  tags: {},

  topArtistCount: 30,
  rotation: true,
});
