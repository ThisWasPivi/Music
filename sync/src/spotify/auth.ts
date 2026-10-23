import { createHash, randomBytes } from "node:crypto";

import type { SpotifyEnv } from "../env.ts";
import { ReauthorizationRequiredError, SyncError } from "../errors.ts";
import { tokenErrorSchema, tokenSchema } from "./schemas.ts";

/** Read-only scopes: private and collaborative playlists, top items. */
export const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-top-read",
] as const;

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

/**
 * A PKCE verifier and its S256 challenge.
 * @property verifier - Secret kept by the CLI until the code exchange
 * @property challenge - Hash sent with the authorization request
 */
export interface PkcePair {
  verifier: string;
  challenge: string;
}

/**
 * Creates a fresh PKCE pair.
 * @returns The verifier and its challenge
 */
export function createPkcePair(): PkcePair {
  const verifier = randomBytes(64).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/**
 * Builds the URL the user opens to authorize the app.
 * @param env - Spotify settings
 * @param challenge - PKCE challenge
 * @param state - Anti-CSRF value echoed back on the redirect
 * @returns The authorization URL
 */
export function buildAuthorizeUrl(
  env: SpotifyEnv,
  challenge: string,
  state: string,
): string {
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SCOPES.join(" "),
    state,
  }).toString();
  return url.toString();
}

/**
 * A usable access token.
 * @property accessToken - Bearer token for API calls
 * @property expiresAt - Epoch milliseconds after which it must be refreshed
 * @property refreshToken - New refresh token, when Spotify rotated it
 */
export interface TokenGrant {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}

/**
 * Posts a form to the token endpoint with the client credentials.
 * @param env - Spotify settings
 * @param body - Grant parameters
 * @param fetchImpl - Fetch implementation, swappable in tests
 * @param now - Clock, swappable in tests
 * @returns The grant
 */
async function requestToken(
  env: SpotifyEnv,
  body: Record<string, string>,
  fetchImpl: typeof fetch,
  now: () => number,
): Promise<TokenGrant> {
  const basic = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");
  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ ...body, client_id: env.SPOTIFY_CLIENT_ID }),
  });
  const json: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = tokenErrorSchema.safeParse(json);
    const code = error.success ? error.data.error : `HTTP ${response.status}`;
    const description = error.success
      ? error.data.error_description
      : undefined;
    if (
      body.grant_type === "refresh_token" &&
      (code === "invalid_grant" || code === "invalid_request")
    ) {
      throw new ReauthorizationRequiredError(description);
    }
    if (code === "invalid_client") {
      throw new SyncError(
        "Spotify rejects the credentials: check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.",
      );
    }
    throw new SyncError(
      `Spotify token endpoint error: ${code}${description ? ` (${description})` : ""}.`,
    );
  }

  const token = tokenSchema.parse(json);
  return {
    accessToken: token.access_token,
    /* Refresh a minute early so a long request never runs on a dying token. */
    expiresAt: now() + (token.expires_in - 60) * 1000,
    refreshToken: token.refresh_token,
  };
}

/**
 * Exchanges an authorization code for tokens.
 * @param env - Spotify settings
 * @param code - Code from the redirect
 * @param verifier - PKCE verifier of this authorization
 * @param fetchImpl - Fetch implementation
 * @param now - Clock
 * @returns The grant, including the refresh token
 */
export async function exchangeCode(
  env: SpotifyEnv,
  code: string,
  verifier: string,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<TokenGrant> {
  return requestToken(
    env,
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
      code_verifier: verifier,
    },
    fetchImpl,
    now,
  );
}

/**
 * Trades the stored refresh token for an access token.
 * @param env - Spotify settings, with the refresh token
 * @param fetchImpl - Fetch implementation
 * @param now - Clock
 * @returns The grant; `refreshToken` is set when Spotify rotated it
 */
export async function refreshAccessToken(
  env: SpotifyEnv,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<TokenGrant> {
  if (!env.SPOTIFY_REFRESH_TOKEN) {
    throw new SyncError(
      "SPOTIFY_REFRESH_TOKEN is missing from .env: run `pnpm auth` first.",
    );
  }
  return requestToken(
    env,
    { grant_type: "refresh_token", refresh_token: env.SPOTIFY_REFRESH_TOKEN },
    fetchImpl,
    now,
  );
}
