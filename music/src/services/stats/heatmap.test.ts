import { describe, expect, it } from "vitest";

import { track } from "@/test/builders.ts";

import { buildAddedHeatmap } from "./heatmap.ts";

describe("buildAddedHeatmap", () => {
  it("is empty without tracks", () => {
    expect(buildAddedHeatmap([])).toEqual({ weeks: [], max: 0, total: 0 });
  });

  it("starts weeks on Monday and counts per UTC day", () => {
    /* 2024-01-03 is a Wednesday; 2024-01-08 the next Monday. */
    const heatmap = buildAddedHeatmap([
      track({ addedAt: "2024-01-03T23:30:00.000Z" }),
      track({ addedAt: "2024-01-03T08:00:00.000Z" }),
      track({ addedAt: "2024-01-08T12:00:00.000Z" }),
    ]);
    expect(heatmap.weeks).toHaveLength(2);
    expect(heatmap.weeks[0]?.[0]?.date).toBe("2024-01-01");
    expect(heatmap.weeks[0]?.[2]).toEqual({ date: "2024-01-03", count: 2 });
    expect(heatmap.weeks[1]?.[0]).toEqual({ date: "2024-01-08", count: 1 });
    expect(heatmap.max).toBe(2);
    expect(heatmap.total).toBe(3);
    expect(heatmap.weeks.every((week) => week.length === 7)).toBe(true);
  });
});
