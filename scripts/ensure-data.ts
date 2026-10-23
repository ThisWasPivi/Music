/*
 * Makes sure the app has data to build from. The published JSON is not in
 * git: `pnpm release` uploads it to the `data` GitHub Release and the deploy
 * downloads it. A fresh clone, or a CI run before the first release, gets
 * the invented sample issues instead.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** The files `PlaylistRepository` imports. */
const DATA_FILES = [
  "meta.json",
  "playlists.json",
  "artists.json",
  "rotation.json",
];

const dataDir = new URL("../music/src/data/", import.meta.url);
const missing = DATA_FILES.filter(
  (file) => !existsSync(fileURLToPath(new URL(file, dataDir))),
);

if (missing.length > 0) {
  console.log(
    `No data in music/src/data (missing ${missing.join(", ")}): writing the sample issues.`,
  );
  const result = spawnSync("pnpm", ["fixtures"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  process.exit(result.status ?? 1);
}
