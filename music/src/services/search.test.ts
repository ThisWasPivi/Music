import { describe, expect, it } from "vitest";

import { artist, playlist, track } from "@/test/builders.ts";

import { buildSearchIndex, searchIndex } from "./search.ts";

const shared = track({ id: "s1", title: "Sto Bene", artists: ["Sick Budd"] });
const newer = playlist({
  id: "new",
  name: "Summer Drive",
  tracks: [shared, track({ id: "s2", title: "Dubbi", artists: ["Marracash"] })],
});
const older = playlist({ id: "old", name: "Winter Rain", tracks: [shared] });
const index = buildSearchIndex(
  [newer, older],
  [artist("Sick Budd"), artist("Marracash")],
  () => undefined,
);

describe("buildSearchIndex", () => {
  it("lists each track and album once, pointing at the newest playlist", () => {
    const tracks = index.filter((entry) => entry.kind === "track");
    expect(tracks.map((entry) => entry.id)).toEqual(["s1", "s2"]);
    expect(tracks[0]?.playlistId).toBe("new");
  });
});

describe("searchIndex", () => {
  it("groups matches by kind, with typos allowed", () => {
    const groups = searchIndex(index, "marracas");
    expect(groups.map((group) => group.kind)).toEqual([
      "artist",
      "album",
      "track",
    ]);
  });

  it("finds playlists by name and returns nothing for a blank query", () => {
    expect(searchIndex(index, "winter")[0]?.entries[0]?.id).toBe("old");
    expect(searchIndex(index, "  ")).toEqual([]);
  });
});
