import { describe, expect, it } from "vitest";

import { playlist, track } from "@/test/builders.ts";

import { releaseYears, reviewYear } from "./years.ts";

/**
 * Builds a playlist released on a day, one track per artist.
 * @param id - Playlist id
 * @param day - ISO date of the first track
 * @param artists - Artist ids
 * @returns The playlist
 */
function released(id: string, day: string, artists: string[]) {
  return playlist({
    id,
    tracks: artists.map((artist) =>
      track({
        id: `${id}-${artist}`,
        artists: [artist],
        addedAt: `${day}T12:00:00.000Z`,
      }),
    ),
  });
}

const all = [
  released("a", "2023-11-10", ["x", "y"]),
  released("b", "2024-02-01", ["x", "z"]),
  released("c", "2024-02-20", ["z", "w", "v"]),
  released("d", "2024-07-05", ["v"]),
  playlist({ id: "empty" }),
];

describe("releaseYears", () => {
  it("lists the years with releases, newest first", () => {
    expect(releaseYears(all)).toEqual([2024, 2023]);
  });
});

describe("reviewYear", () => {
  it("collects the year's playlists and its first-time artists", () => {
    const review = reviewYear(all, 2024);
    expect(review.playlists.map((entry) => entry.id)).toEqual(["b", "c", "d"]);
    expect(review.newArtists.map((artist) => artist.id)).toEqual([
      "z",
      "w",
      "v",
    ]);
    expect(review.tracks).toHaveLength(6);
    expect(review.busiestMonth).toEqual({ month: 1, count: 2 });
    expect(review.previousCount).toBe(1);
    expect(review.longest?.id).toBe("c");
  });

  it("has no previous year for the first one", () => {
    const review = reviewYear(all, 2023);
    expect(review.previousCount).toBeNull();
    expect(review.newArtists).toHaveLength(2);
  });

  it("is empty for a year without releases", () => {
    const review = reviewYear(all, 2020);
    expect(review.playlists).toEqual([]);
    expect(review.longest).toBeNull();
    expect(review.busiestMonth).toBeNull();
  });
});
