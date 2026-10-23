import { describe, expect, it } from "vitest";

import {
  extractIssueNumber,
  findMissingIssues,
  matchesSeriesPrefix,
  normalizeName,
  SERIES_PREFIX,
} from "./series.ts";

describe("matchesSeriesPrefix", () => {
  it("matches the prefix with the two U+0259 schwas", () => {
    expect(SERIES_PREFIX).toContain("əə");
    expect(matchesSeriesPrefix("Pivəəkly 12")).toBe(true);
  });

  it("is case-insensitive, including the capital schwa U+018F", () => {
    expect(matchesSeriesPrefix("PIVƏƏKLY #3")).toBe(true);
    expect(matchesSeriesPrefix("pivəəkly 3")).toBe(true);
  });

  it("does not match lookalikes written with a plain e", () => {
    expect(matchesSeriesPrefix("Piveekly 12")).toBe(false);
    expect(matchesSeriesPrefix("Pivəekly 12")).toBe(false);
  });

  it("normalizes to NFC before comparing", () => {
    const decomposedPrefix = "Pivéekly";
    expect(normalizeName(decomposedPrefix)).toBe("pivéekly");
    expect(matchesSeriesPrefix("Pivéekly 1", decomposedPrefix)).toBe(true);
  });

  it("ignores surrounding whitespace and rejects an empty prefix", () => {
    expect(matchesSeriesPrefix("  Pivəəkly 4 ")).toBe(true);
    expect(matchesSeriesPrefix("anything", "")).toBe(false);
  });

  it("only matches at the start of the name", () => {
    expect(matchesSeriesPrefix("Best of Pivəəkly")).toBe(false);
  });
});

describe("extractIssueNumber", () => {
  it.each([
    ["Pivəəkly 12", 12],
    ["Pivəəkly #12", 12],
    ["Pivəəkly #012", 12],
    ["Pivəəkly Nº 7", 7],
    ["Pivəəkly n. 7", 7],
    ["Pivəəkly - 30: estate", 30],
    ["PIVƏƏKLY 5 — summer edition", 5],
    ["Pivəəkly12", 12],
  ])("reads %s as %i", (name, expected) => {
    expect(extractIssueNumber(name)).toBe(expected);
  });

  it("returns null when the name has no number", () => {
    expect(extractIssueNumber("Pivəəkly — Rarities")).toBeNull();
    expect(extractIssueNumber("Pivəəkly")).toBeNull();
  });

  it("returns null outside the series", () => {
    expect(extractIssueNumber("Mixtape 12")).toBeNull();
  });
});

describe("findMissingIssues", () => {
  it("lists the gaps between 1 and the highest issue", () => {
    expect(findMissingIssues([1, 2, 4, 7])).toEqual([3, 5, 6]);
  });

  it("returns nothing for an empty or complete sequence", () => {
    expect(findMissingIssues([])).toEqual([]);
    expect(findMissingIssues([3, 1, 2])).toEqual([]);
  });
});
