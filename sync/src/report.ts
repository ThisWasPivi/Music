import { findMissingIssues } from "@music/shared";

import type { Selection, SkipReason } from "./selection.ts";

const SKIP_LABELS: Record<SkipReason, string> = {
  excluded: "esclusa in playlists.config.ts",
  "not-owner": "non sei owner",
  "no-match": "nome senza prefisso",
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

  lines.push(`Incluse (${selected.length}):`);
  for (const entry of selected) {
    const why =
      entry.reason === "include" ? "in include" : `prefisso "${prefix}"`;
    lines.push(
      `  + ${entry.playlist.name}  [${entry.number === null ? "senza numero" : `Nº ${entry.number}`}, ${why}]`,
    );
  }

  const relevant = skipped.filter(
    (entry) => entry.reason !== "no-match" || entry.nearMiss,
  );
  const others = skipped.length - relevant.length;
  lines.push(`Escluse (${skipped.length}):`);
  for (const entry of relevant) {
    const hint = entry.nearMiss
      ? `; somiglia a "${prefix}": controlla le "ə" (U+0259) o aggiungila a include`
      : "";
    lines.push(
      `  - ${entry.playlist.name}  [${SKIP_LABELS[entry.reason]}${hint}]`,
    );
  }
  if (others > 0)
    lines.push(`  - altre ${others} playlist con nome fuori serie`);

  const unnumbered = selected.filter((entry) => entry.number === null);
  for (const entry of unnumbered)
    lines.push(`! "${entry.playlist.name}" non ha un numero: andrà in fondo.`);

  const numbers = selected.flatMap((entry) =>
    entry.number === null ? [] : [entry.number],
  );
  const duplicates = numbers.filter(
    (value, index) => numbers.indexOf(value) !== index,
  );
  for (const value of new Set(duplicates))
    lines.push(`! Il Nº ${value} compare in più playlist.`);

  const missing = findMissingIssues(numbers);
  if (missing.length > 0)
    lines.push(`! Numeri mancanti nella serie: ${missing.join(", ")}.`);

  for (const id of unknownIds)
    lines.push(
      `! L'id ${id} in include/exclude non corrisponde a nessuna tua playlist.`,
    );
  return lines;
}
