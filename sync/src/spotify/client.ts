import type { z } from "zod";

import { SyncError } from "../errors.ts";
import type { TokenGrant } from "./auth.ts";
import { noCache, type ResponseCache } from "./cache.ts";
import { pagingSchema } from "./schemas.ts";

const API_BASE = "https://api.spotify.com/v1";

/**
 * Tuning and collaborators of the client, all swappable in tests.
 * @property getToken - Returns a valid grant; called again after a 401
 * @property fetch - Fetch implementation
 * @property cache - Response cache
 * @property minIntervalMs - Minimum spacing between two requests
 * @property maxRetries - Attempts after the first for 429, 5xx and network errors
 * @property baseBackoffMs - First backoff when no Retry-After is given
 * @property sleep - Waits a number of milliseconds
 * @property now - Clock
 * @property log - Receives progress notes (retries, waits)
 */
export interface ClientOptions {
  getToken: (forceRefresh: boolean) => Promise<TokenGrant>;
  fetch?: typeof fetch;
  cache?: ResponseCache;
  minIntervalMs?: number;
  maxRetries?: number;
  baseBackoffMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  log?: (message: string) => void;
}

/**
 * Per-request cache policy.
 * @property key - Cache key; defaults to the URL
 * @property maxAgeMs - Reuse a cached response younger than this; 0 disables
 */
export interface CachePolicy {
  key?: string;
  maxAgeMs: number;
}

/**
 * Parses a Retry-After header (seconds or an HTTP date).
 * @param header - The header value
 * @param now - Current epoch milliseconds
 * @returns Milliseconds to wait, or undefined when absent or unparseable
 */
export function parseRetryAfter(
  header: string | null,
  now: number,
): number | undefined {
  if (header === null || header.trim() === "") return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}

/**
 * Minimal, polite Spotify Web API client: one request at a time with a
 * minimum spacing, retries with backoff on 429 (honouring Retry-After), 5xx
 * and network errors, a token refresh on 401, and an optional disk cache.
 */
export class SpotifyClient {
  readonly #options: Required<ClientOptions>;
  #lastRequestAt = Number.NEGATIVE_INFINITY;
  #queue: Promise<unknown> = Promise.resolve();

  /**
   * Creates the client.
   * @param options - Collaborators and tuning
   */
  constructor(options: ClientOptions) {
    this.#options = {
      fetch: globalThis.fetch.bind(globalThis),
      cache: noCache,
      minIntervalMs: 120,
      maxRetries: 5,
      baseBackoffMs: 1000,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      now: Date.now,
      log: () => undefined,
      ...options,
    };
  }

  /**
   * Fetches and validates one resource.
   * @param pathOrUrl - Path under /v1 (e.g. "/me") or a full `next` URL
   * @param schema - Schema of the response body
   * @param cache - Cache policy; omitted means always fetch
   * @returns The parsed body
   */
  async get<T extends z.ZodType>(
    pathOrUrl: string,
    schema: T,
    cache?: CachePolicy,
  ): Promise<z.infer<T>> {
    const url = pathOrUrl.startsWith("https://")
      ? pathOrUrl
      : `${API_BASE}${pathOrUrl}`;
    const key = cache?.key ?? url;

    if (cache && cache.maxAgeMs > 0) {
      const hit = await this.#options.cache.get(key, cache.maxAgeMs);
      const parsed = hit === undefined ? undefined : schema.safeParse(hit);
      if (parsed?.success) return parsed.data;
    }

    const body = await this.#enqueue(() => this.#request(url));
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new SyncError(
        `Unexpected response from ${new URL(url).pathname}: ${result.error.issues
          .slice(0, 3)
          .map((issue) => `${issue.path.join(".")} ${issue.message}`)
          .join("; ")}. L'API Spotify potrebbe essere cambiata.`,
      );
    }
    if (cache && cache.maxAgeMs > 0) await this.#options.cache.set(key, body);
    return result.data;
  }

  /**
   * Follows `next` links and concatenates every page.
   * @param path - First page path, including `limit`
   * @param itemSchema - Schema of one item
   * @param cache - Cache policy; page keys are derived from it
   * @returns All items
   */
  async getAll<T extends z.ZodType>(
    path: string,
    itemSchema: T,
    cache?: CachePolicy,
  ): Promise<z.infer<T>[]> {
    const page = pagingSchema(itemSchema);
    const items: z.infer<T>[] = [];
    let next: string | null | undefined = path;
    let index = 0;
    while (next) {
      const result: z.infer<typeof page> = await this.get(
        next,
        page,
        cache
          ? { ...cache, key: `${cache.key ?? path}#page${index}` }
          : undefined,
      );
      items.push(...result.items);
      next = result.next;
      index += 1;
    }
    return items;
  }

  /**
   * Serializes requests so throttling holds even with concurrent callers.
   * @param task - The request to run
   * @returns The task's result
   */
  #enqueue<R>(task: () => Promise<R>): Promise<R> {
    const run = this.#queue.then(task, task);
    this.#queue = run.catch(() => undefined);
    return run;
  }

  /**
   * Performs one GET with throttling, retries and token refresh.
   * @param url - Absolute URL
   * @returns The JSON body
   */
  async #request(url: string): Promise<unknown> {
    const {
      fetch: fetchImpl,
      sleep,
      now,
      log,
      maxRetries,
      baseBackoffMs,
      minIntervalMs,
    } = this.#options;
    let forceRefresh = false;
    let refreshed = false;

    for (let attempt = 0; ; attempt += 1) {
      const wait = this.#lastRequestAt + minIntervalMs - now();
      if (wait > 0) await sleep(wait);
      this.#lastRequestAt = now();

      const token = await this.#options.getToken(forceRefresh);
      forceRefresh = false;

      let response: Response;
      try {
        response = await fetchImpl(url, {
          headers: { Authorization: `Bearer ${token.accessToken}` },
        });
      } catch (error) {
        if (attempt >= maxRetries)
          throw new SyncError(
            `Network unavailable towards Spotify: ${String(error)}`,
            { cause: error },
          );
        const backoff = baseBackoffMs * 2 ** attempt;
        log(`Network error, retrying in ${backoff} ms`);
        await sleep(backoff);
        continue;
      }

      if (response.ok) return response.json();

      if (response.status === 401 && !refreshed) {
        refreshed = true;
        forceRefresh = true;
        continue;
      }

      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < maxRetries
      ) {
        const retryAfter = parseRetryAfter(
          response.headers.get("Retry-After"),
          now(),
        );
        const backoff = retryAfter ?? baseBackoffMs * 2 ** attempt;
        log(
          `Spotify ha risposto ${response.status}, attendo ${Math.ceil(backoff / 1000)} s`,
        );
        await sleep(backoff);
        continue;
      }

      const path = new URL(url).pathname;
      if (response.status === 403) {
        throw new SyncError(
          `Spotify denied access to ${path} (403). Development Mode needs a Premium account and playlists you own or collaborate on.`,
        );
      }
      if (response.status === 404)
        throw new SyncError(`Not found on Spotify: ${path}.`);
      throw new SyncError(
        `Request to ${path} failed with HTTP ${response.status}.`,
      );
    }
  }
}
