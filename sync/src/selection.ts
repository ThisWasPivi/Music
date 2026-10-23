import {
  extractIssueNumber,
  matchesSeriesPrefix,
  normalizeName,
} from "@music/shared";

import type { SyncConfig } from "./config.ts";
import type { SimplifiedPlaylistDto } from "./spotify/schemas.ts";

/** Why a playlist was published. */
export type IncludeReason = "prefix" | "include";

/** Why a playlist was not published. */
export type SkipReason = "excluded" | "not-owner" | "no-match";

/**
 * A playlist chosen for publication.
 * @property playlist - The listed playlist
 * @property number - Issue number parsed from the name, or null
 * @property reason - Which rule selected it
 */
export interface SelectedPlaylist {
  playlist: SimplifiedPlaylistDto;
  number: number | null;
  reason: IncludeReason;
}

/**
 * A playlist left out.
 * @property playlist - The listed playlist
 * @property reason - Which rule left it out
 * @property nearMiss - The name looks like the series but does not match exactly
 */
export interface SkippedPlaylist {
  playlist: SimplifiedPlaylistDto;
  reason: SkipReason;
  nearMiss: boolean;
}

/**
 * The outcome of the selection, for publishing and for the summary.
 * @property selected - Playlists to publish, ordered by issue number (unnumbered last)
 * @property skipped - Playlists left out
 * @property unknownIds - Ids in `include` or `exclude` that no listed playlist has
 */
export interface Selection {
  selected: SelectedPlaylist[];
  skipped: SkippedPlaylist[];
  unknownIds: string[];
}

/**
 * Folds a name to plain ASCII-ish letters, so "Piveekly" or "Pivəekly"
 * resemble "Pivəəkly" and can be flagged as probable typos.
 * @param value - A name
 * @returns The folded name
 */
function fold(value: string): string {
  return normalizeName(value)
    .replace(/[əǝ]/gu, "e")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Applies the publication rules to the account's playlists.
 *
 * Only playlists owned by the account are ever selected. `exclude` wins over
 * everything; `include` adds owned playlists whatever their name.
 * @param playlists - Every playlist from GET /me/playlists
 * @param ownerId - Id of the authorized account
 * @param config - Publication rules
 * @returns Selected and skipped playlists with reasons
 */
export function selectPlaylists(
  playlists: readonly SimplifiedPlaylistDto[],
  ownerId: string,
  config: Pick<SyncConfig, "prefix" | "include" | "exclude">,
): Selection {
  const include = new Set(config.include);
  const exclude = new Set(config.exclude);
  const selected: SelectedPlaylist[] = [];
  const skipped: SkippedPlaylist[] = [];
  const folded = fold(config.prefix);

  for (const playlist of playlists) {
    const matches = matchesSeriesPrefix(playlist.name, config.prefix);
    const nearMiss = !matches && fold(playlist.name).startsWith(folded);

    if (exclude.has(playlist.id)) {
      skipped.push({ playlist, reason: "excluded", nearMiss });
    } else if (playlist.owner.id !== ownerId) {
      if (matches || include.has(playlist.id) || nearMiss)
        skipped.push({ playlist, reason: "not-owner", nearMiss });
      else skipped.push({ playlist, reason: "no-match", nearMiss: false });
    } else if (matches) {
      selected.push({
        playlist,
        number: extractIssueNumber(playlist.name, config.prefix),
        reason: "prefix",
      });
    } else if (include.has(playlist.id)) {
      selected.push({
        playlist,
        number: extractIssueNumber(playlist.name, config.prefix),
        reason: "include",
      });
    } else {
      skipped.push({ playlist, reason: "no-match", nearMiss });
    }
  }

  const listed = new Set(playlists.map((playlist) => playlist.id));
  const unknownIds = [...include, ...exclude].filter((id) => !listed.has(id));

  selected.sort((a, b) => {
    if (a.number === null || b.number === null)
      return Number(a.number === null) - Number(b.number === null);
    return a.number - b.number;
  });
  return { selected, skipped, unknownIds };
}
