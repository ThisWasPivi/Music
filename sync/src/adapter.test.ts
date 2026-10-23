import { describe, expect, it } from "vitest";

import {
  adaptArtist,
  adaptPlaylist,
  adaptPlaylistItem,
  pickImage,
  plainDescription,
  releaseYearOf,
} from "./adapter.ts";
import { playlistItemSchema } from "./spotify/schemas.ts";
import { itemDto, playlistDto, trackDto } from "./test/dto.ts";

describe("adaptPlaylistItem", () => {
  it("maps a track to the domain model", () => {
    expect(
      adaptPlaylistItem(itemDto(trackDto("t1", { explicit: true }))),
    ).toEqual({
      id: "t1",
      title: "Song t1",
      artists: [
        {
          id: "ar-t1",
          name: "Artist t1",
          url: "https://open.spotify.com/artist/ar-t1",
        },
      ],
      album: {
        id: "al-t1",
        name: "Album t1",
        url: "https://open.spotify.com/album/al-t1",
        imageUrl: "https://i.scdn.co/image/medium",
      },
      releaseYear: 1999,
      durationMs: 200_000,
      explicit: true,
      addedAt: "2024-02-01T10:00:00.000Z",
      url: "https://open.spotify.com/track/t1",
    });
  });

  it("never carries added_by over", () => {
    const track = adaptPlaylistItem(itemDto(trackDto("t1")));
    expect(JSON.stringify(track)).not.toContain("collab-user");
    expect(track).not.toHaveProperty("added_by");
  });

  it("accepts the pre-2026 `track` key", () => {
    expect(
      adaptPlaylistItem({
        added_at: "2024-01-01T00:00:00Z",
        track: trackDto("legacy"),
      })?.id,
    ).toBe("legacy");
  });

  it("skips local files, episodes, null items and malformed tracks", () => {
    expect(
      adaptPlaylistItem({ ...itemDto(trackDto("x")), is_local: true }),
    ).toBeNull();
    expect(adaptPlaylistItem(itemDto({ type: "episode" }))).toBeNull();
    expect(adaptPlaylistItem(itemDto(null))).toBeNull();
    expect(adaptPlaylistItem(itemDto(trackDto("x", { id: null })))).toBeNull();
    expect(
      adaptPlaylistItem({ ...itemDto(trackDto("x")), added_at: null }),
    ).toBeNull();
    expect(adaptPlaylistItem(itemDto({ type: "track" }))).toBeNull();
  });

  it("drops credited artists without an id", () => {
    const track = adaptPlaylistItem(
      itemDto(
        trackDto("t", {
          artists: [
            { id: null, name: "Local" },
            { id: "a", name: "A" },
          ],
        }),
      ),
    );
    expect(track?.artists.map((artist) => artist.id)).toEqual(["a"]);
  });

  it("parses real-shaped JSON through the schema", () => {
    const raw = {
      added_at: "2024-01-01T00:00:00Z",
      added_by: { id: "u", type: "user", uri: "spotify:user:u" },
      item: { ...trackDto("z"), popularity: 3 },
    };
    const parsed = playlistItemSchema.parse(raw);
    expect(adaptPlaylistItem(parsed)?.id).toBe("z");
  });
});

describe("adaptPlaylist", () => {
  it("derives totals and dates from the kept tracks", () => {
    const playlist = adaptPlaylist(
      playlistDto("p1", "Pivəəkly 3"),
      [
        itemDto(
          trackDto("b", { duration_ms: 100_000 }),
          "2024-03-05T00:00:00Z",
        ),
        itemDto(trackDto("a", { duration_ms: 50_000 }), "2024-03-01T00:00:00Z"),
        itemDto({ type: "episode" }),
      ],
      { number: 3, tags: ["chill"], palette: ["#112233"] },
    );
    expect(playlist).toMatchObject({
      id: "p1",
      number: 3,
      trackCount: 2,
      durationMs: 150_000,
      firstAddedAt: "2024-03-01T00:00:00.000Z",
      lastAddedAt: "2024-03-05T00:00:00.000Z",
      coverUrl: "https://mosaic.scdn.co/640/abc",
      url: "https://open.spotify.com/playlist/p1",
      tags: ["chill"],
      palette: ["#112233"],
      description: "Issue & friends '24 link",
    });
    expect(playlist).not.toHaveProperty("owner");
  });

  it("handles an empty playlist", () => {
    const playlist = adaptPlaylist(
      { ...playlistDto("p", "Pivəəkly 1"), images: null },
      [],
      { number: 1, tags: [], palette: [] },
    );
    expect(playlist).toMatchObject({
      trackCount: 0,
      firstAddedAt: null,
      coverUrl: null,
    });
  });
});

describe("helpers", () => {
  it("picks images by size", () => {
    const images = [
      { url: "s", width: 64 },
      { url: "l", width: 640 },
      { url: "m", width: 300 },
    ];
    expect(pickImage(images, "largest")).toBe("l");
    expect(pickImage(images, 160)).toBe("m");
    expect(pickImage(images, 1000)).toBe("l");
    expect(pickImage([], "largest")).toBeNull();
  });

  it("reads release years of any precision", () => {
    expect(releaseYearOf("2021")).toBe(2021);
    expect(releaseYearOf("2021-03-04")).toBe(2021);
    expect(releaseYearOf("0000")).toBeNull();
    expect(releaseYearOf(null)).toBeNull();
  });

  it("turns HTML descriptions into text", () => {
    expect(plainDescription("A &amp; B&nbsp;<b>bold</b> &#39;x&#39;")).toBe(
      "A & B bold 'x'",
    );
    expect(plainDescription(null)).toBe("");
  });

  it("maps artists with their image", () => {
    expect(
      adaptArtist({
        id: "a",
        name: "A",
        images: [{ url: "https://i/a", width: 320 }],
      }),
    ).toEqual({
      id: "a",
      name: "A",
      url: "https://open.spotify.com/artist/a",
      imageUrl: "https://i/a",
    });
    expect(adaptArtist({ id: null, name: "x" })).toBeNull();
  });
});
