import { describe, expect, it } from "vitest";

import { findSecrets } from "./security.ts";

const rules = (text: string, literals?: string[]) =>
  findSecrets(text, literals).map((finding) => finding.rule);

describe("findSecrets", () => {
  it("flags token-like strings", () => {
    expect(rules(`x="BQ${"a".repeat(120)}"`)).toContain("Spotify access token");
    expect(rules(`AQ${"b".repeat(100)}`)).toContain("Spotify refresh token");
    expect(rules("Authorization: Bearer abcdefghijklmnopqrstuvwxyz")).toContain(
      "Bearer header",
    );
    expect(rules("id=0123456789abcdef0123456789abcdef;")).toContain(
      "Client id/secret (32 hex)",
    );
    expect(rules("SPOTIFY_CLIENT_SECRET=abc")).toContain("Env variable");
  });

  it("flags user identifiers and forbidden keys", () => {
    expect(rules('"uri":"spotify:user:pivi"')).toContain("Spotify user URI");
    expect(rules("https://open.spotify.com/user/pivi")).toContain(
      "Spotify user link",
    );
    expect(rules('{"added_by": {}}')).toContain("Forbidden JSON key");
    expect(rules('{ "owner" : 1 }')).toContain("Forbidden JSON key");
  });

  it("flags literal .env values but ignores short ones", () => {
    expect(
      rules("... my-real-secret-value ...", ["my-real-secret-value", "x"]),
    ).toEqual(["Valore di .env"]);
    expect(rules("x", ["x"])).toEqual([]);
  });

  it("leaves ordinary published data alone", () => {
    const sample = JSON.stringify({
      id: "4uLU6hMCjMI75M1A2tKUQC",
      url: "https://open.spotify.com/playlist/4uLU6hMCjMI75M1A2tKUQC",
      coverUrl:
        "https://i.scdn.co/image/ab67616d0000b2731234567890abcdef12345678",
      mosaic:
        "https://mosaic.scdn.co/640/ab67616d0000b273aaaaaaaaaaaaaaaaaaaaaaaaab67616d0000b273bbbbbbbbbbbbbbbbbbbbbbbb",
      addedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(findSecrets(sample)).toEqual([]);
  });

  it("truncates excerpts", () => {
    expect(findSecrets(`BQ${"c".repeat(80)}`)[0]?.excerpt).toBe("BQcccccccc…");
  });
});
