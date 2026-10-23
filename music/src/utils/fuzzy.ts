/**
 * Small fuzzy matcher shared by every search box and dropdown.
 *
 * Text is folded (lower case, no diacritics, "ə" read as "e", punctuation as
 * spaces). Each query word must match some word of the text, scored from
 * best to worst:
 * - exact substring of the whole text: 1
 * - prefix of a word: 0.9
 * - inside a word: 0.8
 * - typo-tolerant prefix (optimal string alignment distance): 0.7 minus 0.1 per edit
 * - letters in order inside one word, for words of 3+ letters: 0.35
 * The allowed typos grow with the word: none up to 3 letters, 1 up to 6,
 * 2 from 7 letters on.
 */

/**
 * Folds text for matching.
 * @param value - Any text
 * @returns Lower-case ASCII-ish words separated by single spaces
 */
export function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/[əǝ]/gu, "e")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Optimal string alignment distance: Levenshtein plus adjacent swaps.
 * @param a - First string
 * @param b - Second string
 * @returns The number of edits
 */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const columns = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: columns }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < columns; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const row = d[i] as number[];
      const previous = d[i - 1] as number[];
      row[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        row[j] = Math.min(
          row[j] ?? 0,
          ((d[i - 2] as number[])[j - 2] ?? 0) + 1,
        );
      }
    }
  }
  return (d[a.length] as number[])[b.length] ?? 0;
}

/**
 * Number of typos tolerated for a query word.
 * @param length - Length of the query word
 * @returns Allowed edits
 */
function allowedEdits(length: number): number {
  if (length <= 3) return 0;
  return length <= 6 ? 1 : 2;
}

/**
 * Tells whether the letters of `needle` appear in order in `haystack`.
 * @param needle - Query word
 * @param haystack - Text word
 * @returns True for a subsequence match
 */
function isSubsequence(needle: string, haystack: string): boolean {
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
}

/**
 * Scores one query word against one text word.
 * @param token - Query word
 * @param word - Text word
 * @returns The score, or 0 for no match
 */
function scoreWord(token: string, word: string): number {
  if (word.startsWith(token)) return 0.9;
  if (word.includes(token)) return 0.8;
  const allowed = allowedEdits(token.length);
  if (allowed > 0) {
    const distance = Math.min(
      editDistance(token, word.slice(0, token.length)),
      editDistance(token, word),
    );
    if (distance <= allowed) return 0.7 - 0.1 * distance;
  }
  if (token.length >= 3 && isSubsequence(token, word)) return 0.35;
  return 0;
}

/**
 * Scores a query against one or more texts.
 * @param query - What the user typed
 * @param texts - Texts to search, e.g. a title and an artist
 * @returns A score in (0, 1], 1 for a blank query, or null for no match
 */
export function fuzzyScore(
  query: string,
  ...texts: readonly string[]
): number | null {
  const needle = fold(query);
  if (needle === "") return 1;
  const haystack = fold(texts.join(" "));
  if (haystack.includes(needle)) return 1;

  const words = haystack.split(" ");
  let total = 0;
  for (const token of needle.split(" ")) {
    let best = 0;
    for (const word of words) {
      best = Math.max(best, scoreWord(token, word));
      if (best >= 0.9) break;
    }
    if (best === 0) return null;
    total += best;
  }
  return total / needle.split(" ").length;
}

/**
 * Tells whether a query matches any of the texts.
 * @param query - What the user typed
 * @param texts - Texts to search
 * @returns True on a match, always true for a blank query
 */
export function fuzzyMatches(
  query: string,
  ...texts: readonly string[]
): boolean {
  return fuzzyScore(query, ...texts) !== null;
}

/**
 * Filters and ranks items by how well they match a query.
 * @param items - Items to search
 * @param query - What the user typed
 * @param textsOf - Searchable texts of an item
 * @returns Matching items, best first; all items, in order, for a blank query
 */
export function fuzzyRank<T>(
  items: readonly T[],
  query: string,
  textsOf: (item: T) => readonly string[],
): T[] {
  if (fold(query) === "") return [...items];
  return items
    .map((item, index) => ({
      item,
      index,
      score: fuzzyScore(query, ...textsOf(item)),
    }))
    .filter(
      (entry): entry is { item: T; index: number; score: number } =>
        entry.score !== null,
    )
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}
