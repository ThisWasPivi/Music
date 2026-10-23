/*
 * `pnpm release`: sync the data, verify everything, then upload the
 * published JSON to the `data` GitHub Release and start the GitHub Pages
 * deploy. The data never enters git. Needs the GitHub CLI, signed in with
 * `gh auth login` (or a `GH_TOKEN`) on this machine.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DATA_DIR = join(ROOT, "music/src/data");
const DATA_FILES = [
  "meta.json",
  "playlists.json",
  "artists.json",
  "rotation.json",
];
const RELEASE_TAG = "data";
const WORKFLOW = "deploy.yml";

/**
 * Runs a command in the repository, streaming its output.
 * @param command - Executable
 * @param args - Arguments
 * @returns Nothing; exits the process when the command fails
 */
function run(command: string, args: string[]): void {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(
      `\n✗ Release stopped: "${command} ${args.join(" ")}" failed. Nothing was published.`,
    );
    process.exit(result.status ?? 1);
  }
}

/**
 * Runs a command quietly and reports whether it succeeded.
 * @param command - Executable
 * @param args - Arguments
 * @returns True when the command exited with 0
 */
function succeeds(command: string, args: string[]): boolean {
  return (
    spawnSync(command, args, {
      cwd: ROOT,
      stdio: "ignore",
      shell: process.platform === "win32",
    }).status === 0
  );
}

/**
 * Runs git and returns its trimmed output.
 * @param args - Git arguments
 * @returns Standard output
 */
function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

/**
 * Compares the local data with the assets of the data release.
 * @returns True when every file is already published unchanged
 */
function alreadyPublished(): boolean {
  const dir = mkdtempSync(join(tmpdir(), "music-data-"));
  try {
    const downloaded = succeeds("gh", [
      "release",
      "download",
      RELEASE_TAG,
      "--dir",
      dir,
      "--pattern",
      "*.json",
    ]);
    if (!downloaded) return false;
    return DATA_FILES.every((file) => {
      try {
        return (
          readFileSync(join(dir, file), "utf8") ===
          readFileSync(join(DATA_DIR, file), "utf8")
        );
      } catch {
        return false;
      }
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== "main") {
  console.error(`✗ Releases start from main (you are on "${branch}").`);
  process.exit(1);
}
if (!succeeds("gh", ["auth", "status"])) {
  console.error(
    "✗ The GitHub CLI is not signed in. Run `gh auth login` (or set GH_TOKEN) and try again.",
  );
  process.exit(1);
}

run("pnpm", ["sync"]);
run("pnpm", ["check"]);
run("pnpm", ["build"]);
run("pnpm", ["security:scan"]);

if (alreadyPublished()) {
  console.log("\n✓ No changes in the data: nothing to publish.");
  process.exit(0);
}

const today = new Date().toLocaleDateString("sv-SE");
const notes = `Sanitized playlist data for music.pivi.dev, synced ${today}. Written by \`pnpm release\`; the deploy downloads it.`;
if (succeeds("gh", ["release", "view", RELEASE_TAG])) {
  run("gh", ["release", "edit", RELEASE_TAG, "--notes", notes]);
} else {
  run("gh", [
    "release",
    "create",
    RELEASE_TAG,
    "--title",
    "Published data",
    "--notes",
    notes,
    "--latest=false",
  ]);
}
run("gh", [
  "release",
  "upload",
  RELEASE_TAG,
  ...DATA_FILES.map((file) => join(DATA_DIR, file)),
  "--clobber",
]);
run("gh", ["workflow", "run", WORKFLOW, "--ref", "main"]);
console.log(
  "\n✓ Data published: the GitHub Pages deploy is running (`gh run watch` follows it).",
);
