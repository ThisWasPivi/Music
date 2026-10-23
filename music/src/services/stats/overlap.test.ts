import { describe, expect, it } from "vitest";

import { playlist, track } from "@/test/builders.ts";

import { artistOverlapMatrix, jaccard, sharedArtists } from "./overlap.ts";

describe("jaccard", () => {
  it("divides the intersection by the union", () => {
    expect(jaccard(new Set(["a", "b", "c"]), new Set(["b", "c", "d"]))).toBe(
      0.5,
    );
  });

  it("is 0 for two empty sets and 1 for identical ones", () => {
    expect(jaccard(new Set(), new Set())).toBe(0);
    expect(jaccard(new Set(["a"]), new Set(["a"]))).toBe(1);
  });
});

describe("artistOverlapMatrix", () => {
  it("builds a symmetric matrix over artist sets", () => {
    const one = playlist({
      number: 1,
      tracks: [track({ artists: ["a", "b"] })],
    });
    const two = playlist({
      number: 2,
      tracks: [track({ artists: ["b"] }), track({ id: "u", artists: ["c"] })],
    });
    const { values } = artistOverlapMatrix([one, two]);
    expect(values).toEqual([
      [1, 1 / 3],
      [1 / 3, 1],
    ]);
  });
});

describe("sharedArtists", () => {
  it("lists common artists sorted by name", () => {
    const one = playlist({ tracks: [track({ artists: ["z", "m", "q"] })] });
    const two = playlist({ tracks: [track({ artists: ["q", "z"] })] });
    expect(sharedArtists(one, two).map((artist) => artist.id)).toEqual([
      "q",
      "z",
    ]);
  });
});
