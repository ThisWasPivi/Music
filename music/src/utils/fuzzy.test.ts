import { describe, expect, it } from "vitest";

import {
  editDistance,
  fold,
  fuzzyMatches,
  fuzzyRank,
  fuzzyScore,
} from "./fuzzy.ts";

describe("fold", () => {
  it("lower-cases, strips accents and punctuation, reads ə as e", () => {
    expect(fold("Pivəəkly #12 — Città")).toBe("piveekly 12 citta");
  });
});

describe("editDistance", () => {
  it("counts edits and adjacent swaps", () => {
    expect(editDistance("velvet", "velvet")).toBe(0);
    expect(editDistance("velvet", "vlevet")).toBe(1);
    expect(editDistance("harbour", "harbor")).toBe(1);
    expect(editDistance("abc", "")).toBe(3);
  });
});

describe("fuzzyScore", () => {
  it("accepts a blank query", () => {
    expect(fuzzyScore("  ", "anything")).toBe(1);
  });

  it("ranks exact substrings above prefixes above typos", () => {
    const exact = fuzzyScore("velvet harbour", "Velvet Harbour") ?? 0;
    const prefix = fuzzyScore("velv harb", "Velvet Harbour") ?? 0;
    const typo = fuzzyScore("velvte", "Velvet Harbour") ?? 0;
    expect(exact).toBe(1);
    expect(prefix).toBeGreaterThan(typo);
    expect(typo).toBeGreaterThan(0);
  });

  it("tolerates typos according to word length", () => {
    expect(fuzzyMatches("harbor", "Velvet Harbour")).toBe(true);
    expect(fuzzyMatches("hrabour", "Velvet Harbour")).toBe(true);
    expect(fuzzyMatches("vel", "Velvet")).toBe(true);
    expect(fuzzyMatches("vex", "Velvet")).toBe(false);
  });

  it("matches the series name without typing the schwa", () => {
    expect(fuzzyMatches("piveekly 12", "Pivəəkly 12")).toBe(true);
    expect(fuzzyMatches("pivekly", "Pivəəkly 12")).toBe(true);
  });

  it("requires every query word to match somewhere", () => {
    expect(fuzzyMatches("nora salt", "Salt Song", "Nora Kessel")).toBe(true);
    expect(fuzzyMatches("nora zebra", "Salt Song", "Nora Kessel")).toBe(false);
  });

  it("falls back to letters in order", () => {
    expect(fuzzyMatches("vlvt", "Velvet")).toBe(true);
  });
});

describe("fuzzyRank", () => {
  const names = [
    "Nora Kessel",
    "Velvet Harbour",
    "Harbour Lights",
    "Lumen Drift",
  ];

  it("orders matches by score, keeping input order on ties", () => {
    expect(fuzzyRank(names, "harbour", (name) => [name])).toEqual([
      "Velvet Harbour",
      "Harbour Lights",
    ]);
  });

  it("returns everything for a blank query", () => {
    expect(fuzzyRank(names, "", (name) => [name])).toEqual(names);
  });
});
