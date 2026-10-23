import { describe, expect, it } from "vitest";

import { colorSortKey, hexToHsl, readableTextOn } from "./color.ts";
import {
  formatIssue,
  formatLongDuration,
  formatTrackDuration,
} from "./format.ts";

describe("format", () => {
  it("formats durations", () => {
    expect(formatTrackDuration(185_400)).toBe("3:05");
    expect(formatLongDuration(45 * 60_000)).toBe("45 min");
    expect(formatLongDuration(120 * 60_000)).toBe("2 h");
    expect(formatLongDuration(102 * 60_000)).toBe("1 h 42 min");
  });

  it("formats issue numbers", () => {
    expect(formatIssue(12)).toBe("Nº 12");
    expect(formatIssue(null)).toBe("Fuori serie");
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

  it("picks readable text", () => {
    expect(readableTextOn("#ffffff")).toBe("#000000");
    expect(readableTextOn("#101010")).toBe("#ffffff");
  });
});
