import { findMissingIssues } from "@music/shared";

import type { Selection, SkipReason } from "./selection.ts";

const SKIP_LABELS: Record<SkipReason, string> = {
  excluded: "excluded in playlists.config.ts",
  "not-owner": "not the owner",
  "no-match": "name without the prefix",
};

/**
 * Formats the selection summary printed by every sync.
 * @param selection - The selection outcome
 * @param prefix - Series prefix, for the messages
 * @returns The lines to print
 */
export function formatSelectionReport(
  selection: Selection,
  prefix: string,
): string[] {
  const lines: string[] = [];
  const { selected, skipped, unknownIds } = selection;

  lines.push(`Included (${selected.length}):`);
  for (const entry of selected) {
    const why =
      entry.reason === "include" ? "in include" : `prefix "${prefix}"`;
    const issue = entry.number === null ? "no number" : `No. ${entry.number}`;
    lines.push(`  + ${entry.playlist.name}  [${issue}, ${why}]`);
  }

  const relevant = skipped.filter(
    (entry) => entry.reason !== "no-match" || entry.nearMiss,
  );
  const others = skipped.length - relevant.length;
  lines.push(`Skipped (${skipped.length}):`);
  for (const entry of relevant) {
    const hint = entry.nearMiss
      ? `; looks like "${prefix}": check the "ə" (U+0259) or add it to include`
      : "";
    lines.push(
      `  - ${entry.playlist.name}  [${SKIP_LABELS[entry.reason]}${hint}]`,
    );
  }
  if (others > 0) lines.push(`  - ${others} more playlists outside the series`);

  for (const entry of selected.filter((item) => item.number === null)) {
    lines.push(`! "${entry.playlist.name}" has no number: it goes last.`);
  }

  const numbers = selected.flatMap((entry) =>
    entry.number === null ? [] : [entry.number],
  );
  const duplicates = numbers.filter(
    (value, index) => numbers.indexOf(value) !== index,
  );
  for (const value of new Set(duplicates))
    lines.push(`! No. ${value} appears in more than one playlist.`);

  const missing = findMissingIssues(numbers);
  if (missing.length > 0)
    lines.push(`! Numbers missing from the series: ${missing.join(", ")}.`);

  for (const id of unknownIds)
    lines.push(
      `! The id ${id} in include/exclude matches none of your playlists.`,
    );
  return lines;
}
