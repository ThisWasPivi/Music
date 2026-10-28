import { describe, expect, it } from "vitest";

import { playlist, track } from "@/test/builders.ts";

import { chainSorts, filterWith, sortWith, withDirection } from "./core.ts";
import {
  artistFilter,
  byColor,
  decadeFilter,
  playlistSortChain,
  tagFilter,
  textFilter,
} from "./playlists.ts";
import { byArtist, byYear, trackTextFilter } from "./tracks.ts";

const p1 = playlist({
  number: 1,
  name: "Pivəəkly 1",
  durationMs: 50,
  tags: ["chill"],
  palette: ["#0000ff"],
  tracks: [
    track({
      id: "a",
      title: "Città",
      artists: ["Bruno"],
      releaseYear: 1994,
      addedAt: "2024-01-01T10:00:00.000Z",
    }),
  ],
});
const p2 = playlist({
  number: 2,
  name: "Pivəəkly 2",
  tags: ["night"],
  palette: ["#ff0000"],
  tracks: [
    track({
      id: "b",
      artists: ["Ada"],
      releaseYear: 2021,
      addedAt: "2024-02-01T10:00:00.000Z",
    }),
  ],
});
const p10 = playlist({
  number: 10,
  name: "Pivəəkly 10",
  palette: ["#808080"],
  tracks: [
    track({
      id: "c",
      artists: ["Ada"],
      releaseYear: 2023,
      addedAt: "2024-10-01T10:00:00.000Z",
    }),
  ],
});
const loose = playlist({ number: null, name: "Pivəəkly Rarities" });
const all = [p2, loose, p10, p1];

describe("playlist sorting", () => {
  it("defaults to the newest release first, undated playlists last", () => {
    expect(
      sortWith(all, ...playlistSortChain("date", "desc")).map(
        (entry) => entry.number,
      ),
    ).toEqual([10, 2, 1, null]);
  });

  it("keeps undated playlists last in ascending order too", () => {
    expect(
      sortWith(all, ...playlistSortChain("date", "asc")).map(
        (entry) => entry.number,
      ),
    ).toEqual([1, 2, 10, null]);
  });

  it("sorts names numerically", () => {
    expect(
      sortWith([p10, p2, p1], ...playlistSortChain("name", "asc")).map(
        (entry) => entry.number,
      ),
    ).toEqual([1, 2, 10]);
  });

  it("orders by dominant colour along the hue wheel, greys last", () => {
    expect(
      sortWith([p10, p1, p2], byColor).map((entry) => entry.number),
    ).toEqual([2, 1, 10]);
  });

  it("falls back to number for ties", () => {
    const sameLength = [p1, p2].map((entry) => ({ ...entry, durationMs: 1 }));
    expect(
      sortWith(sameLength, ...playlistSortChain("duration", "desc")).map(
        (entry) => entry.number,
      ),
    ).toEqual([2, 1]);
  });
});

describe("playlist filters", () => {
  it("combine with AND", () => {
    expect(
      filterWith(all, [artistFilter("Ada"), decadeFilter(2020)]).map(
        (entry) => entry.number,
      ),
    ).toEqual([2, 10]);
    expect(filterWith(all, [artistFilter("Ada"), tagFilter("night")])).toEqual([
      p2,
    ]);
  });

  it("search text fuzzily across tracks and artists", () => {
    expect(filterWith(all, [textFilter("brnuo")])).toEqual([p1]);
    expect(filterWith(all, [textFilter("citta")])).toEqual([p1]);
    expect(filterWith(all, [textFilter("bruno")])).toEqual([p1]);
    expect(filterWith(all, [textFilter("  ")])).toHaveLength(4);
  });

  it("match the schwa in names", () => {
    expect(filterWith(all, [textFilter("pivəəkly 10")])).toEqual([p10]);
  });

  it("decade filter excludes the next decade", () => {
    expect(filterWith(all, [decadeFilter(1990)])).toEqual([p1]);
  });
});

describe("core helpers", () => {
  it("withDirection reverses only for desc", () => {
    expect(withDirection(byYear, "asc")).toBe(byYear);
    const tracks = [track({ releaseYear: 2000 }), track({ releaseYear: 2010 })];
    expect(
      sortWith(tracks, withDirection(byYear, "desc"))[0]?.releaseYear,
    ).toBe(2010);
  });

  it("chainSorts uses later strategies only for ties", () => {
    const tracks = [
      track({ id: "1", artists: ["b"], releaseYear: 2000 }),
      track({ id: "2", artists: ["a"], releaseYear: 2000 }),
      track({ id: "3", artists: ["c"], releaseYear: 1990 }),
    ];
    expect(
      [...tracks].sort(chainSorts(byYear, byArtist)).map((entry) => entry.id),
    ).toEqual(["3", "2", "1"]);
  });

  it("puts unknown years last", () => {
    expect(
      sortWith(
        [track({ id: "x", releaseYear: null }), track({ id: "y" })],
        byYear,
      )[0]?.id,
    ).toBe("y");
  });

  it("track text filter matches album and artist", () => {
    const entry = track({ title: "Song", artists: ["Nora"] });
    expect(trackTextFilter("nora").test(entry)).toBe(true);
    expect(trackTextFilter("album").test(entry)).toBe(true);
    expect(trackTextFilter("zzz").test(entry)).toBe(false);
  });
});

describe("name sort", () => {
  it("ignores the # in issue names", () => {
    const names = [
      "Pivəəkly #5",
      "Pivəəkly 1",
      "Pivəəkly 10",
      "Pivəəkly #2",
    ].map((name, index) => playlist({ number: index + 1, name }));
    expect(
      sortWith(names, ...playlistSortChain("name", "asc")).map(
        (entry) => entry.name,
      ),
    ).toEqual(["Pivəəkly 1", "Pivəəkly #2", "Pivəəkly #5", "Pivəəkly 10"]);
  });
});
