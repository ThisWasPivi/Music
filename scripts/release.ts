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
      `\n✗ Release stopped: "${command} ${args.join(" ")}" failed. Nothing was committed.`,
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
  console.error(`✗ Releases start from main (you are on "${branch}").`);
  process.exit(1);
}
if (git("diff", "--cached", "--name-only") !== "") {
  console.error(
    "✗ Some changes are already staged: the release only commits data. Commit or unstage them first.",
  );
  process.exit(1);
}

run("pnpm", ["sync"]);
run("pnpm", ["check"]);
run("pnpm", ["build"]);
run("pnpm", ["security:scan"]);

git("add", "--", DATA_DIR);
if (git("diff", "--cached", "--name-only", "--", DATA_DIR) === "") {
  console.log("\n✓ No changes in the data: nothing to publish.");
  process.exit(0);
}

const today = new Date().toLocaleDateString("sv-SE");
run("git", ["commit", "-m", `chore(data): sync ${today}`, "--", DATA_DIR]);
run("git", ["push", "origin", "main"]);
console.log("\n✓ Data published: the GitHub Pages deploy starts on its own.");
