import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ReauthorizationRequiredError } from "../errors.ts";
import { refreshAccessToken } from "./auth.ts";
import { parseRetryAfter, SpotifyClient } from "./client.ts";

const schema = z.object({ ok: z.boolean() });

/**
 * Builds a JSON response.
 * @param status - HTTP status
 * @param body - JSON body
 * @param headers - Extra headers
 * @returns The response
 */
function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Creates a client over a scripted fetch and a fake clock.
 * @param responses - Responses returned in order
 * @returns The client and its spies
 */
function setup(responses: Response[]) {
  let clock = 0;
  const sleeps: number[] = [];
  const fetchMock = vi.fn(async () => responses.shift() ?? json(500, {}));
  const getToken = vi.fn(async (force: boolean) => ({
    accessToken: force ? "fresh" : "stale",
    expiresAt: Infinity,
  }));
  const client = new SpotifyClient({
    getToken,
    fetch: fetchMock as unknown as typeof fetch,
    sleep: async (ms) => {
      sleeps.push(ms);
      clock += ms;
    },
    now: () => clock,
    minIntervalMs: 100,
  });
  return { client, fetchMock, getToken, sleeps };
}

describe("SpotifyClient", () => {
  it("waits for Retry-After on 429 and retries", async () => {
    const { client, sleeps, fetchMock } = setup([
      json(429, {}, { "Retry-After": "3" }),
      json(200, { ok: true }),
    ]);
    await expect(client.get("/me", schema)).resolves.toEqual({ ok: true });
    expect(sleeps).toContain(3000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("backs off exponentially on 5xx without Retry-After", async () => {
    const { client, sleeps } = setup([
      json(503, {}),
      json(502, {}),
      json(200, { ok: true }),
    ]);
    await client.get("/me", schema);
    expect(sleeps.filter((ms) => ms >= 1000)).toEqual([1000, 2000]);
  });

  it("gives up after the retry budget", async () => {
    const { client } = setup(
      Array.from({ length: 10 }, () => json(429, {}, { "Retry-After": "1" })),
    );
    await expect(client.get("/me", schema)).rejects.toThrow(/HTTP 429/);
  });

  it("refreshes the token once on 401", async () => {
    const { client, getToken, fetchMock } = setup([
      json(401, {}),
      json(200, { ok: true }),
    ]);
    await client.get("/me", schema);
    expect(getToken).toHaveBeenLastCalledWith(true);
    const headers = (
      fetchMock.mock.calls as unknown as [string, RequestInit][]
    )[1]?.[1].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer fresh");
  });

  it("throttles consecutive requests", async () => {
    const { client, sleeps } = setup([
      json(200, { ok: true }),
      json(200, { ok: true }),
    ]);
    await client.get("/a", schema);
    await client.get("/b", schema);
    expect(sleeps).toEqual([100]);
  });

  it("explains 403 in Development Mode terms", async () => {
    const { client } = setup([json(403, {})]);
    await expect(client.get("/playlists/x/items", schema)).rejects.toThrow(
      /Development Mode/,
    );
  });

  it("follows next links", async () => {
    const { client } = setup([
      json(200, {
        items: [{ ok: true }],
        next: "https://api.spotify.com/v1/me/playlists?offset=1",
      }),
      json(200, { items: [{ ok: false }], next: null }),
    ]);
    await expect(client.getAll("/me/playlists", schema)).resolves.toEqual([
      { ok: true },
      { ok: false },
    ]);
  });

  it("serves cached responses without fetching", async () => {
    const store = new Map<string, unknown>([["k", { ok: true }]]);
    const fetchMock = vi.fn();
    const client = new SpotifyClient({
      getToken: async () => ({ accessToken: "t", expiresAt: Infinity }),
      fetch: fetchMock as unknown as typeof fetch,
      cache: {
        get: async (key) => store.get(key),
        set: async (key, value) => void store.set(key, value),
      },
    });
    await expect(
      client.get("/me", schema, { key: "k", maxAgeMs: 1000 }),
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports unexpected shapes clearly", async () => {
    const { client } = setup([json(200, { ok: "yes" })]);
    await expect(client.get("/me", schema)).rejects.toThrow(
      /Unexpected response from \/v1\/me/,
    );
  });
});

describe("parseRetryAfter", () => {
  it("reads seconds and HTTP dates", () => {
    expect(parseRetryAfter("2", 0)).toBe(2000);
    expect(parseRetryAfter(new Date(5000).toUTCString(), 0)).toBe(5000);
    expect(parseRetryAfter(null, 0)).toBeUndefined();
    expect(parseRetryAfter("soon", 0)).toBeUndefined();
  });
});

describe("refreshAccessToken", () => {
  const env = {
    SPOTIFY_CLIENT_ID: "id",
    SPOTIFY_CLIENT_SECRET: "secret",
    SPOTIFY_REDIRECT_URI: "http://127.0.0.1:8888/callback",
    SPOTIFY_REFRESH_TOKEN: "refresh",
  };

  it("asks to rerun pnpm auth when the refresh token expired", async () => {
    const fetchMock = vi.fn(async () =>
      json(400, {
        error: "invalid_grant",
        error_description: "Refresh token revoked",
      }),
    );
    const promise = refreshAccessToken(
      env,
      fetchMock as unknown as typeof fetch,
    );
    await expect(promise).rejects.toBeInstanceOf(ReauthorizationRequiredError);
    await expect(
      refreshAccessToken(env, fetchMock as unknown as typeof fetch),
    ).rejects.toThrow(/pnpm auth/);
  });

  it("returns the access token and a rotated refresh token", async () => {
    const fetchMock = vi.fn(async () =>
      json(200, {
        access_token: "a",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: "r2",
      }),
    );
    const grant = await refreshAccessToken(
      env,
      fetchMock as unknown as typeof fetch,
      () => 0,
    );
    expect(grant).toEqual({
      accessToken: "a",
      expiresAt: 3_540_000,
      refreshToken: "r2",
    });
  });

  it("requires a stored refresh token", async () => {
    await expect(
      refreshAccessToken({ ...env, SPOTIFY_REFRESH_TOKEN: undefined }),
    ).rejects.toThrow(/pnpm auth/);
  });
});
