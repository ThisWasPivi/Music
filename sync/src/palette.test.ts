import { describe, expect, it } from "vitest";

import { extractPalette } from "./palette.ts";

/**
 * Builds raw RGB pixels from runs of one colour.
 * @param runs - Colour and pixel count pairs
 * @returns Packed RGB bytes
 */
function pixels(...runs: [[number, number, number], number][]): Uint8Array {
  return Uint8Array.from(
    runs.flatMap(([color, count]) =>
      Array.from({ length: count }, () => color).flat(),
    ),
  );
}

describe("extractPalette", () => {
  it("orders colours by dominance", () => {
    expect(
      extractPalette(
        pixels([[255, 0, 0], 10], [[0, 0, 255], 30], [[0, 255, 0], 20]),
      ),
    ).toEqual(["#0000ff", "#00ff00", "#ff0000"]);
  });

  it("skips near-duplicates of an already picked colour", () => {
    expect(
      extractPalette(
        pixels([[200, 0, 0], 30], [[210, 5, 0], 20], [[0, 0, 200], 5]),
        2,
      ),
    ).toEqual(["#c80000", "#0000c8"]);
  });

  it("returns nothing for an empty image", () => {
    expect(extractPalette(new Uint8Array())).toEqual([]);
  });
});
