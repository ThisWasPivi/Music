import { createFixtureCatalog } from "@music/shared/fixtures";
import { describe, expect, it } from "vitest";

import type { PublishedData } from "./output.ts";
import { findForbiddenKeys, redact, sanitize } from "./sanitize.ts";

/**
 * Builds publishable sample data.
 * @returns A fresh copy of the fixtures
 */
function sample(): PublishedData {
  const catalog = createFixtureCatalog();
  return {
    meta: { generatedAt: "2026-01-01T00:00:00.000Z", source: "spotify" },
    ...catalog,
    playlists: catalog.playlists.slice(0, 2),
  };
}

describe("sanitize", () => {
  it("strips keys the domain does not declare, at any depth", () => {
    const data = sample();
    const dirty = {
      ...data,
      owner: { id: "me" },
      playlists: data.playlists.map((playlist) => ({
        ...playlist,
        owner: { id: "me", display_name: "Me" },
        collaborative: true,
        tracks: playlist.tracks.map((track) => ({
          ...track,
          added_by: { id: "collab" },
          popularity: 3,
        })),
      })),
    } as unknown as PublishedData;
    const { data: clean } = sanitize(dirty, []);
    expect(findForbiddenKeys(clean)).toEqual([]);
    const json = JSON.stringify(clean);
    expect(json).not.toContain("added_by");
    expect(json).not.toContain("collab");
    expect(json).not.toContain("popularity");
    expect(json).not.toContain("collaborative");
  });

  it("removes the owner and collaborators from authored text only", () => {
    const data = sample();
    const first = data.playlists[0];
    if (!first) throw new Error("fixture missing");
    data.playlists[0] = {
      ...first,
      description: "Curata da PiviUser con collab-42, buon ascolto",
    };
    const { data: clean, warnings } = sanitize(data, [
      "piviuser",
      "collab-42",
      "x",
    ]);
    expect(clean.playlists[0]?.description).toBe(
      "Curata da con , buon ascolto",
    );
    expect(warnings).toHaveLength(1);
  });

  it("rejects data that does not match the domain", () => {
    const data = sample();
    const broken = {
      ...data,
      playlists: [{ ...data.playlists[0], url: "https://evil.example/p" }],
    } as PublishedData;
    expect(() => sanitize(broken, [])).toThrow(/cannot be published/);
  });
});

describe("helpers", () => {
  it("findForbiddenKeys reports paths", () => {
    expect(findForbiddenKeys({ a: [{ added_by: 1 }], email: "x" })).toEqual([
      "a.0.added_by",
      "email",
    ]);
  });

  it("redact is case-insensitive and escapes regex characters", () => {
    expect(redact("By A.B (a.b)", ["a.b"])).toBe("By ()");
  });
});
