import { describe, expect, it } from "vitest";

import {
  accentFromPalette,
  auroraTint,
  colorSortKey,
  colourfulOf,
  contrastRatio,
  DEFAULT_ACCENT,
  hexToHsl,
  hslToHex,
  markerColor,
  vivid,
  withContrast,
} from "./color.ts";
import { formatLongDuration, formatTrackDuration } from "./format.ts";

describe("format", () => {
  it("formats durations", () => {
    expect(formatTrackDuration(185_400)).toBe("3:05");
    expect(formatLongDuration(45 * 60_000)).toBe("45 min");
    expect(formatLongDuration(120 * 60_000)).toBe("2 h");
    expect(formatLongDuration(102 * 60_000)).toBe("1 h 42 min");
  });
});

describe("color", () => {
  it("converts hex to HSL", () => {
    expect(hexToHsl("#ff0000")).toEqual({
      hue: 0,
      saturation: 1,
      lightness: 0.5,
    });
    expect(hexToHsl("#00ff00").hue).toBe(120);
    expect(hexToHsl("nope")).toEqual({ hue: 0, saturation: 0, lightness: 0 });
  });

  it("parks greys after every hue", () => {
    expect(colorSortKey("#808080")).toBeGreaterThan(colorSortKey("#ff00ff"));
  });
});

describe("accent helpers", () => {
  it("computes WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("adjusts a colour until it meets the requested contrast", () => {
    for (const color of [
      "#ffee00",
      "#00ff88",
      "#3355ff",
      "#ff2266",
      "#101010",
    ]) {
      expect(
        contrastRatio(withContrast(color, "#e2e4ec", 4.8), "#e2e4ec"),
      ).toBeGreaterThanOrEqual(4.8);
      expect(
        contrastRatio(withContrast(color, "#1a1924", 4.8), "#1a1924"),
      ).toBeGreaterThanOrEqual(4.8);
    }
  });

  it("keeps colours that already contrast", () => {
    expect(withContrast("#000000", "#ffffff")).toBe("#000000");
  });

  it("brightens near-black cover colours into usable accents", () => {
    expect(hexToHsl(vivid("#0a0a20")).lightness).toBeGreaterThanOrEqual(0.5);
    expect(accentFromPalette([])).toEqual(DEFAULT_ACCENT);
  });

  it("skips greys and fills accents with the aurora defaults", () => {
    const accent = accentFromPalette(["#4a4a4a", "#2266dd", "#9a9a9a"]);
    expect(hexToHsl(accent.c1).hue).toBeCloseTo(hexToHsl("#2266dd").hue, 0);
    expect(accent.c2).toBe(DEFAULT_ACCENT.c1);
  });

  it("gives grey covers an aurora tint by position", () => {
    expect(markerColor(["#555555", "#aaaaaa"], 0)).toBe(vivid(auroraTint(0)));
    expect(markerColor(["#555555", "#ff0000"], 0.5)).toBe(vivid("#ff0000"));
    expect(hexToHsl(auroraTint(1)).hue).toBeCloseTo(320, 0);
    expect(colourfulOf(["#808080", "#ff0000", "#aa3333"])).toEqual([
      "#ff0000",
      "#aa3333",
    ]);
  });

  it("round-trips HSL", () => {
    expect(hslToHex(hexToHsl("#3366cc"))).toBe("#3366cc");
  });
});
