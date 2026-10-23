import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import enGB from "./locales/en-GB.json";
import itIT from "./locales/it-IT.json";

/**
 * Flattens a message tree into dotted keys.
 * @param tree - Nested messages
 * @param prefix - Key prefix
 * @returns Every leaf key
 */
function keys(tree: object, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? keys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

/**
 * Lists source files under a folder.
 * @param dir - Folder
 * @returns Paths of .vue and .ts files
 */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(vue|ts)$/.test(name) && !name.endsWith(".test.ts") ? [path] : [];
  });
}

describe("locales", () => {
  it("have the same keys in every language", () => {
    expect(keys(itIT).sort()).toEqual(keys(enGB).sort());
  });

  it("define every key the code uses", () => {
    /* Vitest runs from the package folder; happy-dom rewrites import.meta.url. */
    const root = join(process.cwd(), "src");
    const used = new Set<string>();
    for (const file of sources(root)) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(
        /\bt\(\s*["']([\w.]+)["']|keypath="([\w.]+)"|labelKey: "([\w.]+)"/g,
      )) {
        used.add(match[1] ?? match[2] ?? match[3] ?? "");
      }
    }
    const defined = new Set(keys(enGB));
    expect([...used].filter((key) => !defined.has(key))).toEqual([]);
  });
});
