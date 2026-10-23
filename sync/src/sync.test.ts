import { describe, expect, it } from "vitest";

import { defineConfig } from "./config.ts";
import { noCache } from "./spotify/cache.ts";
import { SpotifyClient } from "./spotify/client.ts";
import { runSync } from "./sync.ts";
import { itemDto, playlistDto, trackDto } from "./test/dto.ts";

/**
 * A fake Spotify API answering by path.
 * @param routes - JSON bodies keyed by path (without /v1)
 * @returns A fetch implementation
 */
function fakeApi(routes: Record<string, unknown>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    const path = url.pathname.replace(/^\/v1/, "");
    const body = routes[path];
    return body === undefined
      ? new Response("{}", { status: 404 })
      : new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
}

describe("runSync", () => {
  it("publishes only selected playlists, sanitized", async () => {
    const shared = trackDto("shared");
    const fetchImpl = fakeApi({
      "/me": {
        id: "me-user",
        display_name: "Pivi Owner",
        email: "me@example.com",
      },
      "/me/playlists": {
        items: [
          playlistDto("p1", "Pivəəkly 1"),
          playlistDto("p2", "Pivəəkly 2"),
          playlistDto("p3", "Private diary"),
          playlistDto("p4", "Pivəəkly 3", "other-user"),
        ],
        next: null,
      },
      "/playlists/p1/items": {
        items: [itemDto(shared), itemDto(trackDto("one"))],
        next: null,
      },
      "/playlists/p2/items": {
        items: [itemDto(shared, "2024-03-01T00:00:00Z")],
        next: null,
      },
      "/artists/ar-shared": {
        id: "ar-shared",
        name: "Artist shared",
        images: [{ url: "https://i.scdn.co/a", width: 300 }],
        followers: { total: 3 },
      },
      "/artists/ar-one": { id: "ar-one", name: "Artist one", images: [] },
      "/me/top/artists": {
        items: [{ id: "ar-one", name: "Artist one", images: [] }],
        next: null,
      },
      "/me/top/tracks": { items: [trackDto("top")], next: null },
    });
    const client = new SpotifyClient({
      getToken: async () => ({ accessToken: "t", expiresAt: Infinity }),
      fetch: fetchImpl,
      minIntervalMs: 0,
    });
    const lines: string[] = [];
    const data = await runSync({
      client,
      cache: noCache,
      config: defineConfig({}),
      palette: async () => ["#123456"],
      log: (line) => lines.push(line),
      now: () => new Date("2026-05-01T00:00:00Z"),
    });

    expect(data.playlists.map((playlist) => playlist.id)).toEqual(["p1", "p2"]);
    expect(data.playlists[0]).toMatchObject({
      number: 1,
      trackCount: 2,
      palette: ["#123456"],
    });
    expect(data.artists.map((artist) => artist.id)).toEqual([
      "ar-shared",
      "ar-one",
    ]);
    expect(data.rotation.tracks.map((track) => track.id)).toEqual(["top"]);
    expect(data.meta).toEqual({
      generatedAt: "2026-05-01T00:00:00.000Z",
      source: "spotify",
    });

    const json = JSON.stringify(data);
    for (const secret of [
      "me-user",
      "Pivi Owner",
      "me@example.com",
      "collab-user",
      "other-user",
      "Private diary",
      "followers",
    ]) {
      expect(json).not.toContain(secret);
    }
    expect(lines.join("\n")).toContain("Incluse (2)");
    expect(lines.join("\n")).toContain("non sei owner");
  });

  it("keeps going without the rotation section when top items fail", async () => {
    const fetchImpl = fakeApi({
      "/me": { id: "me-user" },
      "/me/playlists": { items: [], next: null },
    });
    const client = new SpotifyClient({
      getToken: async () => ({ accessToken: "t", expiresAt: Infinity }),
      fetch: fetchImpl,
      minIntervalMs: 0,
    });
    const lines: string[] = [];
    const data = await runSync({
      client,
      cache: noCache,
      config: defineConfig({}),
      palette: async () => [],
      log: (line) => lines.push(line),
    });
    expect(data.rotation).toEqual({ artists: [], tracks: [] });
    expect(lines.some((line) => line.includes("In rotazione"))).toBe(true);
  });
});
