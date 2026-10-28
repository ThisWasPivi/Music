import { describe, expect, it } from "vitest";

import { playlist, track } from "@/test/builders.ts";

import {
  discoveryByIssue,
  recurringArtists,
  releaseTimeline,
  repeatedTracks,
  seriesOrder,
} from "./series.ts";

/**
 * Builds an issue released on a day, crediting the given artists.
 * @param number - Issue number
 * @param day - ISO date of the first track
 * @param artists - One track per artist id
 * @returns The issue
 */
function issue(number: number | null, day: string, artists: string[]) {
  return playlist({
    number,
    tracks: artists.map((id) =>
      track({
        id: `${number}-${id}`,
        artists: [id],
        addedAt: `${day}T12:00:00.000Z`,
      }),
    ),
  });
}

describe("seriesOrder", () => {
  it("sorts by release date, whatever the numbers, undated last", () => {
    const result = seriesOrder([
      issue(3, "2024-01-03", ["a"]),
      playlist({ number: 9, name: "Empty" }),
      issue(null, "2024-01-01", ["a"]),
      issue(1, "2024-01-02", ["a"]),
    ]);
    expect(result.map((entry) => entry.number)).toEqual([null, 1, 3, 9]);
  });
});

describe("releaseTimeline", () => {
  it("measures gaps between releases in days", () => {
    const timeline = releaseTimeline([
      issue(2, "2024-01-11", ["a"]),
      issue(1, "2024-01-01", ["a"]),
      issue(3, "2024-01-13", ["a"]),
    ]);
    expect(timeline.releases.map((release) => release.gapDays)).toEqual([
      null,
      10,
      2,
    ]);
    expect(timeline.averageGapDays).toBe(6);
    expect(timeline.minGap?.playlist.number).toBe(3);
    expect(timeline.maxGap?.playlist.number).toBe(2);
  });

  it("skips playlists without tracks and handles a single release", () => {
    const timeline = releaseTimeline([
      issue(1, "2024-01-01", ["a"]),
      playlist({ number: 2 }),
    ]);
    expect(timeline.releases).toHaveLength(1);
    expect(timeline.averageGapDays).toBeNull();
    expect(timeline.minGap).toBeNull();
  });
});

describe("recurringArtists", () => {
  it("counts playlists, first/last and the longest run in series order", () => {
    const rows = recurringArtists([
      issue(1, "2024-01-01", ["a", "b"]),
      issue(2, "2024-01-02", ["a"]),
      issue(4, "2024-01-04", ["a", "b"]),
      issue(5, "2024-01-05", ["b"]),
      issue(6, "2024-01-06", ["a"]),
    ]);
    const a = rows.find((row) => row.artist.id === "a");
    const b = rows.find((row) => row.artist.id === "b");
    /* No playlist 3: 2 → 4 are neighbours in the series, so the run goes on. */
    expect(a).toMatchObject({ issueCount: 4, longestStreak: 3, trackCount: 4 });
    expect([a?.first.number, a?.last.number]).toEqual([1, 6]);
    expect(b).toMatchObject({ issueCount: 3, longestStreak: 2 });
    expect([b?.first.number, b?.last.number]).toEqual([1, 5]);
    expect(rows[0]?.artist.id).toBe("a");
  });
});

describe("discoveryByIssue", () => {
  it("counts artists never seen in an earlier issue", () => {
    const rows = discoveryByIssue([
      issue(2, "2024-01-02", ["a", "c"]),
      issue(1, "2024-01-01", ["a", "b"]),
      issue(3, "2024-01-03", []),
    ]);
    expect(
      rows.map((row) => row.newArtists.map((artist) => artist.id)),
    ).toEqual([["a", "b"], ["c"], []]);
    expect(rows[1]?.discoveryRate).toBe(0.5);
    expect(rows[2]?.discoveryRate).toBe(0);
  });
});

describe("repeatedTracks", () => {
  it("lists tracks in more than one playlist, in series order", () => {
    const shared = track({ id: "shared", addedAt: "2024-02-01T00:00:00.000Z" });
    const later = playlist({ number: 3, tracks: [shared] });
    const earlier = playlist({
      number: 1,
      tracks: [
        { ...shared, addedAt: "2024-01-01T00:00:00.000Z" },
        track({ id: "solo", addedAt: "2024-01-01T00:00:00.000Z" }),
      ],
    });
    const rows = repeatedTracks([later, earlier]);
    expect(rows.map((row) => row.issues)).toEqual([[earlier, later]]);
  });
});
