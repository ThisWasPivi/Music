/*
 * Fails when published data or the built site contains something that looks
 * like a credential, a user identifier or a forbidden key. Runs in
 * `pnpm release` and in CI. Usage: tsx scripts/security-scan.ts [paths…]
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

import { findSecrets } from "../shared/src/security.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DEFAULT_TARGETS = ["music/src/data", "music/dist"];
const TEXT_EXTENSIONS = new Set([
  ".json",
  ".js",
  ".mjs",
  ".css",
  ".html",
  ".svg",
  ".txt",
  ".map",
  ".webmanifest",
  "",
]);

/**
 * Lists every text file under a path.
 * @param path - File or folder
 * @returns Absolute file paths; empty when the path does not exist
 */
async function textFiles(path: string): Promise<string[]> {
  const info = await stat(path).catch(() => undefined);
  if (!info) return [];
  if (info.isFile()) return TEXT_EXTENSIONS.has(extname(path)) ? [path] : [];
  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => textFiles(join(path, entry.name))),
  );
  return nested.flat();
}

/**
 * Reads the real credential values, if a local `.env` exists, so they can be
 * searched for literally.
 * @returns The non-empty values
 */
async function envLiterals(): Promise<string[]> {
  const text = await readFile(join(ROOT, ".env"), "utf8").catch(() => "");
  return Object.values(parseEnv(text)).filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}

const targets =
  process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_TARGETS;
const literals = await envLiterals();
let scanned = 0;
let failures = 0;

for (const target of targets) {
  for (const file of await textFiles(join(ROOT, target))) {
    scanned += 1;
    for (const finding of findSecrets(await readFile(file, "utf8"), literals)) {
      failures += 1;
      console.error(
        `✗ ${relative(ROOT, file)}: ${finding.rule} (${finding.excerpt})`,
      );
    }
  }
}

if (failures > 0) {
  console.error(
    `\nVerifica di sicurezza fallita: ${failures} problemi in ${scanned} file.`,
  );
  process.exit(1);
}
console.log(
  `✓ Verifica di sicurezza: ${scanned} file puliti (${targets.join(", ")}).`,
);
