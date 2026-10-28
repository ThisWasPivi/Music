import type { Playlist } from "@music/shared";

import type { TooltipContent } from "@/composables/useTooltip.ts";
import { i18n } from "@/i18n/index.ts";

import { formatDate } from "./format.ts";

/**
 * Tooltip for a playlist: its cover and name, with the release date and
 * track count, or a custom detail line.
 * @param playlist - The playlist
 * @param detail - Replaces the default date and track count
 * @returns The tooltip content
 */
export function playlistTooltip(
  playlist: Playlist,
  detail?: string,
): TooltipContent {
  const { t } = i18n.global;
  return {
    text: playlist.name,
    image: playlist.coverUrl,
    detail:
      detail ??
      `${formatDate(playlist.firstAddedAt)} · ${t(
        "common.tracks",
        { n: playlist.trackCount },
        playlist.trackCount,
      )}`,
  };
}
