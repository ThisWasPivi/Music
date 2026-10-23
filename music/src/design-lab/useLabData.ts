import type { Playlist } from "@music/shared";

import type { BarRow } from "@/components/stats/BarRanking.vue";
import type { Column } from "@/components/stats/ColumnChart.vue";
import { playlistRepository } from "@/repositories/PlaylistRepository.ts";
import {
  artistOverlapMatrix,
  buildAddedHeatmap,
  discoveryByIssue,
  numberedIssues,
  recurringArtists,
  releaseDistribution,
  releaseTimeline,
  repeatedTracks,
  summarize,
  topAlbums,
  topArtists,
  tracksOf,
} from "@/services/stats";
import { sortWith } from "@/strategies/core.ts";
import { playlistSortChain } from "@/strategies/playlists.ts";
import { formatLongDuration, formatNumber } from "@/utils/format.ts";

/**
 * Computes, once, everything the design mock-ups show. The mock-ups are
 * static compositions, so the data never changes while the lab is open.
 * @returns The derived sample data
 */
function computeLabData() {
  const playlists = sortWith(
    playlistRepository.all(),
    ...playlistSortChain("number", "desc"),
  );
  const issues = numberedIssues(playlists);
  const tracks = tracksOf(playlists);
  const featured = playlists[0] as Playlist;
  const featuredIndex = issues.findIndex((issue) => issue.id === featured.id);
  const recentIssues = issues.slice(-10);
  const timeline = releaseTimeline(playlists);
  const discovery = discoveryByIssue(playlists);

  const artistRows: BarRow[] = topArtists(tracks, "tracks", 8).map((row) => ({
    key: row.item.id,
    label: row.item.name,
    sublabel: formatLongDuration(row.totalMs),
    value: row.trackCount,
    display: formatNumber(row.trackCount),
  }));
  const artistMinuteRows: BarRow[] = topArtists(tracks, "minutes", 8).map(
    (row) => ({
      key: row.item.id,
      label: row.item.name,
      value: row.totalMs,
      display: formatLongDuration(row.totalMs),
    }),
  );
  const albumRows: BarRow[] = topAlbums(tracks, "tracks", 6).map((row) => ({
    key: row.item.id,
    label: row.item.name,
    value: row.trackCount,
    display: formatNumber(row.trackCount),
  }));

  const decadeColumns: Column[] = releaseDistribution(tracks, 10).map(
    (bucket) => ({
      key: String(bucket.key),
      label: `'${String(bucket.key).slice(2)}`,
      value: bucket.count,
      title: `Anni ${bucket.key}: ${bucket.count} brani`,
    }),
  );
  const discoveryColumns: Column[] = discovery.map((row) => ({
    key: row.playlist.id,
    label: String(row.playlist.number),
    value: row.newArtists.length,
    title: `Nº ${row.playlist.number}: ${row.newArtists.length} nuovi artisti su ${row.artistCount}`,
    highlight: row.playlist.id === featured.id,
  }));

  return {
    playlists,
    issues,
    featured,
    previous: featuredIndex > 0 ? issues[featuredIndex - 1] : undefined,
    summary: summarize(tracks),
    featuredSummary: summarize(featured.tracks),
    artistRows,
    artistMinuteRows,
    albumRows,
    heatmap: buildAddedHeatmap(tracks),
    decadeColumns,
    overlap: artistOverlapMatrix(recentIssues),
    overlapLabels: recentIssues.map((issue) => String(issue.number)),
    timeline,
    discovery,
    discoveryColumns,
    recurring: recurringArtists(playlists).slice(0, 8),
    repeated: repeatedTracks(playlists).slice(0, 6),
    tags: [...new Set(playlists.flatMap((playlist) => playlist.tags))].sort(),
    decades: releaseDistribution(tracks, 10).map((bucket) => bucket.key),
    meta: playlistRepository.meta(),
  };
}

/** The derived sample data shown by every design direction. */
export type LabData = ReturnType<typeof computeLabData>;

let cache: LabData | undefined;

/**
 * Returns the shared, lazily computed lab data.
 * @returns The derived sample data
 */
export function useLabData(): LabData {
  cache ??= computeLabData();
  return cache;
}
