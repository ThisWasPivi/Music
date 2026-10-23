import { describe, expect, it } from "vitest";

import { track } from "@/test/builders.ts";

import { buildAddedHeatmap } from "./heatmap.ts";

describe("buildAddedHeatmap", () => {
  it("is empty without tracks", () => {
    expect(buildAddedHeatmap([])).toEqual({ years: [], max: 0, total: 0 });
  });

  it("builds one Monday-first calendar per year, padding outside the year", () => {
    /* 1 January 2024 is a Monday; 1 January 2025 a Wednesday. */
    const heatmap = buildAddedHeatmap([
      track({ addedAt: "2024-01-03T23:30:00.000Z" }),
      track({ addedAt: "2024-01-03T08:00:00.000Z" }),
      track({ addedAt: "2025-01-01T12:00:00.000Z" }),
    ]);
    expect(heatmap.years.map((year) => year.year)).toEqual([2024, 2025]);
    const [y2024, y2025] = heatmap.years;
    expect(y2024?.weeks[0]?.[0]).toEqual({ date: "2024-01-01", count: 0 });
    expect(y2024?.weeks[0]?.[2]).toEqual({ date: "2024-01-03", count: 2 });
    expect(y2024?.total).toBe(2);
    expect(y2025?.weeks[0]?.slice(0, 2)).toEqual([null, null]);
    expect(y2025?.weeks[0]?.[2]).toEqual({ date: "2025-01-01", count: 1 });
    expect(heatmap.max).toBe(2);
    expect(heatmap.total).toBe(3);
    expect(
      heatmap.years.every((year) =>
        year.weeks.every((week) => week.length === 7),
      ),
    ).toBe(true);
    expect(y2024?.weeks.length).toBeGreaterThanOrEqual(52);
  });
});
