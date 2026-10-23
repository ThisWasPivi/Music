import type { SpotifyEnv } from "./env.ts";
import { writeEnvValue } from "./env.ts";
import { refreshAccessToken, type TokenGrant } from "./spotify/auth.ts";

/**
 * Creates the client's token provider: refreshes lazily, reuses the access
 * token until it expires, and saves a rotated refresh token into `.env`.
 * @param env - Spotify settings with the refresh token
 * @param persist - Saves a rotated refresh token
 * @param fetchImpl - Fetch implementation
 * @param now - Clock
 * @returns The provider
 */
export function createTokenProvider(
  env: SpotifyEnv,
  persist: (refreshToken: string) => Promise<void> = (value) =>
    writeEnvValue("SPOTIFY_REFRESH_TOKEN", value),
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): (forceRefresh: boolean) => Promise<TokenGrant> {
  let current: TokenGrant | undefined;
  let settings = env;
  return async (forceRefresh) => {
    if (!forceRefresh && current && current.expiresAt > now()) return current;
    current = await refreshAccessToken(settings, fetchImpl, now);
    if (
      current.refreshToken &&
      current.refreshToken !== settings.SPOTIFY_REFRESH_TOKEN
    ) {
      settings = { ...settings, SPOTIFY_REFRESH_TOKEN: current.refreshToken };
      await persist(current.refreshToken);
    }
    return current;
  };
}
