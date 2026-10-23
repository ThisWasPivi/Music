/** The series every published playlist belongs to. Note the two U+0259 "ə". */
export const SERIES_PREFIX = "Pivəəkly";

/**
 * Normalizes a playlist name for comparisons: NFC, lower case, trimmed.
 *
 * NFC matters because the same "ə" can reach us composed or with stray
 * combining marks depending on the client that typed the name.
 * @param value - The raw name
 * @returns The comparable form of the name
 */
export function normalizeName(value: string): string {
  return value.normalize("NFC").trim().toLowerCase();
}

/**
 * Tells whether a playlist name starts with the series prefix.
 * @param name - The playlist name
 * @param prefix - The series prefix to look for
 * @returns True when the normalized name starts with the normalized prefix
 */
export function matchesSeriesPrefix(
  name: string,
  prefix: string = SERIES_PREFIX,
): boolean {
  const normalizedPrefix = normalizeName(prefix);
  return (
    normalizedPrefix.length > 0 &&
    normalizeName(name).startsWith(normalizedPrefix)
  );
}

/*
 * After the prefix: optional separators, an optional "#", "n.", "nº" or "no",
 * then the digits. Anything after the number (a subtitle) is ignored.
 */
const ISSUE_NUMBER = /^[\s\-–—:.]*(?:#|n[º°o]?\.?)?\s*(\d+)/u;

/**
 * Extracts the issue number from a series playlist name.
 * @param name - The playlist name, e.g. "Pivəəkly #12"
 * @param prefix - The series prefix the name starts with
 * @returns The issue number, or null when the name has none
 */
export function extractIssueNumber(
  name: string,
  prefix: string = SERIES_PREFIX,
): number | null {
  if (!matchesSeriesPrefix(name, prefix)) return null;

  const rest = normalizeName(name).slice(normalizeName(prefix).length);
  const match = ISSUE_NUMBER.exec(rest);
  return match?.[1] === undefined ? null : Number.parseInt(match[1], 10);
}

/**
 * Lists the numbers missing from an issue sequence, between 1 and its maximum.
 * @param numbers - The issue numbers that exist
 * @returns The gaps, in ascending order
 */
export function findMissingIssues(numbers: readonly number[]): number[] {
  const present = new Set(numbers);
  const highest = Math.max(0, ...numbers);
  const missing: number[] = [];
  for (let issue = 1; issue <= highest; issue += 1) {
    if (!present.has(issue)) missing.push(issue);
  }
  return missing;
}
