import { describe, expect, it } from "vitest";

import { extractIssueNumber } from "../series.ts";
import { createFixtureCatalog } from "./index.ts";

describe("createFixtureCatalog", () => {
  it("is deterministic", () => {
    expect(createFixtureCatalog()).toEqual(createFixtureCatalog());
  });

  it("keeps names and numbers consistent", () => {
    for (const playlist of createFixtureCatalog().playlists) {
      expect(extractIssueNumber(playlist.name)).toBe(playlist.number);
      expect(playlist.trackCount).toBe(playlist.tracks.length);
    }
  });
});
