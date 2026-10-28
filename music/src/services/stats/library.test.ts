import { describe, expect, it } from "vitest";

import { track } from "@/test/builders.ts";

import {
  releaseDistribution,
  summarize,
  topAlbums,
  topArtists,
} from "./library.ts";

describe("summarize", () => {
  it("returns zeros for no tracks", () => {
    expect(summarize([])).toMatchObject({
      trackCount: 0,
      averageMs: 0,
      explicitShare: 0,
      longest: null,
      shortest: null,
    });
  });

  it("computes totals, extremes and unique counts", () => {
    const long = track({
      id: "long",
      durationMs: 400_000,
      explicit: true,
      artists: ["a", "b"],
    });
    const short = track({ id: "short", durationMs: 100_000, artists: ["a"] });
    const summary = summarize([long, short, short]);
    expect(summary.trackCount).toBe(3);
    expect(summary.uniqueTrackCount).toBe(2);
    expect(summary.totalMs).toBe(600_000);
    expect(summary.averageMs).toBe(200_000);
    expect(summary.longest?.id).toBe("long");
    expect(summary.shortest?.id).toBe("short");
    expect(summary.explicitShare).toBeCloseTo(1 / 3);
    expect(summary.uniqueArtistCount).toBe(2);
    expect(summary.uniqueAlbumCount).toBe(2);
  });
});

describe("topArtists", () => {
  const tracks = [
    track({ id: "1", artists: ["x"], durationMs: 100 }),
    track({ id: "2", artists: ["x"], durationMs: 100 }),
    track({ id: "3", artists: ["y", "x"], durationMs: 1000 }),
    track({ id: "4", artists: ["y"], durationMs: 1000 }),
  ];

  it("ranks by track count, crediting every artist", () => {
    expect(
      topArtists(tracks, "tracks").map((row) => [row.item.id, row.trackCount]),
    ).toEqual([
      ["x", 3],
      ["y", 2],
    ]);
  });

  it("ranks by minutes", () => {
    expect(topArtists(tracks, "minutes").map((row) => row.item.id)).toEqual([
      "y",
      "x",
    ]);
  });

  it("breaks ties by name and honours the limit", () => {
    const tied = [
      track({ id: "1", artists: ["b"] }),
      track({ id: "2", artists: ["a"] }),
    ];
    expect(topArtists(tied, "tracks", 1).map((row) => row.item.id)).toEqual([
      "a",
    ]);
  });
});

describe("topAlbums", () => {
  it("counts entries per album", () => {
    const album = { id: "al", name: "Al", url: "", imageUrl: null };
    const rows = topAlbums([
      track({ id: "1", album }),
      track({ id: "2", album }),
      track({ id: "3" }),
    ]);
    expect(rows[0]).toMatchObject({ item: { id: "al" }, trackCount: 2 });
  });
});

describe("releaseDistribution", () => {
  it("buckets by decade and fills the gaps", () => {
    const tracks = [
      track({ releaseYear: 1975 }),
      track({ releaseYear: 1999 }),
      track({ releaseYear: 1990 }),
      track({ releaseYear: null }),
    ];
    expect(releaseDistribution(tracks, 10)).toEqual([
      { key: 1970, count: 1 },
      { key: 1980, count: 0 },
      { key: 1990, count: 2 },
    ]);
  });

  it("buckets by year", () => {
    expect(
      releaseDistribution(
        [track({ releaseYear: 2001 }), track({ releaseYear: 2003 })],
        1,
      ),
    ).toEqual([
      { key: 2001, count: 1 },
      { key: 2002, count: 0 },
      { key: 2003, count: 1 },
    ]);
  });

  it("buckets by five years", () => {
    expect(
      releaseDistribution(
        [track({ releaseYear: 1994 }), track({ releaseYear: 2006 })],
        5,
      ),
    ).toEqual([
      { key: 1990, count: 1 },
      { key: 1995, count: 0 },
      { key: 2000, count: 0 },
      { key: 2005, count: 1 },
    ]);
  });

  it("is empty when no year is known", () => {
    expect(releaseDistribution([track({ releaseYear: null })])).toEqual([]);
  });
});
