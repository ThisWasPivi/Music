import type { ArtistProfile, Playlist, Rotation } from "@music/shared";

import { adaptArtist, adaptPlaylist, adaptTopTrack } from "./adapter.ts";
import type { SyncConfig } from "./config.ts";
import { type PublishedData } from "./output.ts";
import { formatSelectionReport } from "./report.ts";
import { sanitize } from "./sanitize.ts";
import { selectPlaylists } from "./selection.ts";
import type { ResponseCache } from "./spotify/cache.ts";
import type { SpotifyClient } from "./spotify/client.ts";
import {
  artistSchema,
  currentUserSchema,
  pagingSchema,
  playlistItemSchema,
  simplifiedPlaylistSchema,
  trackSchema,
} from "./spotify/schemas.ts";

const DAY_MS = 86_400_000;

/**
 * Collaborators of a sync run.
 * @property client - Spotify API client
 * @property cache - Cache for derived data (palettes)
 * @property config - Publication rules
 * @property palette - Extracts a palette from a cover URL
 * @property log - Prints a line
 * @property now - Clock
 */
export interface SyncDeps {
  client: SpotifyClient;
  cache: ResponseCache;
  config: SyncConfig;
  palette: (url: string) => Promise<string[]>;
  log: (line: string) => void;
  now?: () => Date;
}

/**
 * Counts how often each artist is credited across the playlists.
 * @param playlists - Published playlists
 * @returns Artist ids, most credited first
 */
export function rankArtistIds(playlists: readonly Playlist[]): string[] {
  const counts = new Map<string, number>();
  for (const track of playlists.flatMap((playlist) => playlist.tracks)) {
    for (const artist of track.artists)
      counts.set(artist.id, (counts.get(artist.id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);
}

/**
 * Downloads, transforms and sanitizes everything the site publishes.
 * @param deps - Client, config and helpers
 * @returns The sanitized data, ready to be written
 */
export async function runSync(deps: SyncDeps): Promise<PublishedData> {
  const { client, cache, config, log } = deps;
  const now = deps.now ?? (() => new Date());

  const me = await client.get("/me", currentUserSchema);
  const listed = await client.getAll(
    "/me/playlists?limit=50",
    simplifiedPlaylistSchema,
  );
  const selection = selectPlaylists(listed, me.id, config);
  for (const line of formatSelectionReport(selection, config.prefix)) log(line);

  const privateValues = new Set<string>([
    me.id,
    ...(me.display_name ? [me.display_name] : []),
  ]);
  const playlists: Playlist[] = [];

  for (const { playlist, number } of selection.selected) {
    /* Entries only change with the snapshot id, so cache them by it. */
    const entries = await client.getAll(
      `/playlists/${encodeURIComponent(playlist.id)}/items?limit=50`,
      playlistItemSchema,
      playlist.snapshot_id
        ? {
            key: `items:${playlist.id}:${playlist.snapshot_id}`,
            maxAgeMs: 90 * DAY_MS,
          }
        : undefined,
    );
    for (const entry of entries)
      if (entry.added_by?.id) privateValues.add(entry.added_by.id);

    const adapted = adaptPlaylist(playlist, entries, {
      number,
      tags: config.tags[playlist.id] ?? [],
      palette: [],
    });
    let palette: string[] = [];
    if (adapted.coverUrl) {
      const key = `palette:${adapted.coverUrl}`;
      const cached = await cache.get(key, 365 * DAY_MS);
      palette = Array.isArray(cached)
        ? cached.filter((value): value is string => typeof value === "string")
        : await deps.palette(adapted.coverUrl);
      if (!Array.isArray(cached) && palette.length > 0)
        await cache.set(key, palette);
    }
    playlists.push({ ...adapted, palette });
    log(`  ✓ ${adapted.name}: ${adapted.trackCount} tracks`);
  }

  const artists: ArtistProfile[] = [];
  for (const id of rankArtistIds(playlists).slice(0, config.topArtistCount)) {
    const artist = await client.get(
      `/artists/${encodeURIComponent(id)}`,
      artistSchema,
      { maxAgeMs: 14 * DAY_MS },
    );
    const profile = adaptArtist(artist);
    if (profile) artists.push(profile);
  }

  let rotation: Rotation = { artists: [], tracks: [] };
  if (config.rotation) {
    try {
      const top = await client.get(
        "/me/top/artists?time_range=short_term&limit=10",
        pagingSchema(artistSchema),
      );
      const tracks = await client.get(
        "/me/top/tracks?time_range=short_term&limit=10",
        pagingSchema(trackSchema),
      );
      rotation = {
        artists: top.items.flatMap((artist) => adaptArtist(artist) ?? []),
        tracks: tracks.items.flatMap((track) => adaptTopTrack(track) ?? []),
      };
    } catch (error) {
      log(
        `! "In rotation" unavailable (${error instanceof Error ? error.message : String(error)}): section left empty.`,
      );
    }
  }

  const { data, warnings } = sanitize(
    {
      meta: { generatedAt: now().toISOString(), source: "spotify" },
      playlists,
      artists,
      rotation,
    },
    [...privateValues],
  );
  for (const warning of warnings) log(`! ${warning}`);
  return data;
}
