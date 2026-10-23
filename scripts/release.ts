/*
 * `pnpm release`: sync the data, verify everything, then commit only the
 * published JSON and push to main, which triggers the GitHub Pages deploy.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DATA_DIR = "music/src/data";

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
      `\n✗ Release interrotta: "${command} ${args.join(" ")}" è fallito. Nulla è stato committato.`,
    );
    process.exit(result.status ?? 1);
  }
}

/**
 * Runs git and returns its trimmed output.
 * @param args - Git arguments
 * @returns Standard output
 */
function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== "main") {
  console.error(`✗ La release parte da main (sei su "${branch}").`);
  process.exit(1);
}
if (git("diff", "--cached", "--name-only") !== "") {
  console.error(
    "✗ Ci sono modifiche già in stage: la release committa solo i dati. Fai commit o unstage prima.",
  );
  process.exit(1);
}

run("pnpm", ["sync"]);
run("pnpm", ["check"]);
run("pnpm", ["build"]);
run("pnpm", ["security:scan"]);

git("add", "--", DATA_DIR);
if (git("diff", "--cached", "--name-only", "--", DATA_DIR) === "") {
  console.log("\n✓ Nessuna novità nei dati: niente da pubblicare.");
  process.exit(0);
}

const today = new Date().toLocaleDateString("sv-SE");
run("git", ["commit", "-m", `chore(data): sync ${today}`, "--", DATA_DIR]);
run("git", ["push", "origin", "main"]);
console.log("\n✓ Dati pubblicati: il deploy su GitHub Pages parte da solo.");
