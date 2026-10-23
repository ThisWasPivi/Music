import { describe, expect, it } from "vitest";

import { formatSelectionReport } from "./report.ts";
import { selectPlaylists } from "./selection.ts";
import { playlistDto } from "./test/dto.ts";

const rules = {
  prefix: "Pivəəkly",
  include: [] as string[],
  exclude: [] as string[],
};

describe("selectPlaylists", () => {
  it("selects owned playlists whose name starts with the prefix, with the schwa", () => {
    const { selected, skipped } = selectPlaylists(
      [
        playlistDto("a", "Pivəəkly 2"),
        playlistDto("b", "PIVƏƏKLY #1"),
        playlistDto("c", "Piveekly 3"),
        playlistDto("d", "Road trip"),
      ],
      "me-user",
      rules,
    );
    expect(selected.map((entry) => [entry.playlist.id, entry.number])).toEqual([
      ["b", 1],
      ["a", 2],
    ]);
    expect(skipped.find((entry) => entry.playlist.id === "c")).toMatchObject({
      reason: "no-match",
      nearMiss: true,
    });
    expect(skipped.find((entry) => entry.playlist.id === "d")).toMatchObject({
      reason: "no-match",
      nearMiss: false,
    });
  });

  it("matches NFD-decomposed names after NFC normalization", () => {
    const decomposed = "Pivəəkly 4".normalize("NFD");
    expect(
      selectPlaylists([playlistDto("a", decomposed)], "me-user", rules)
        .selected,
    ).toHaveLength(1);
  });

  it("never selects playlists owned by someone else, even when included", () => {
    const { selected, skipped } = selectPlaylists(
      [
        playlistDto("a", "Pivəəkly 1", "someone"),
        playlistDto("b", "Mix", "someone"),
      ],
      "me-user",
      { ...rules, include: ["b"] },
    );
    expect(selected).toEqual([]);
    expect(skipped.map((entry) => entry.reason)).toEqual([
      "not-owner",
      "not-owner",
    ]);
  });

  it("lets exclude win and include add owned playlists", () => {
    const { selected, skipped } = selectPlaylists(
      [playlistDto("a", "Pivəəkly 1"), playlistDto("b", "Rarities")],
      "me-user",
      { ...rules, include: ["b"], exclude: ["a"] },
    );
    expect(
      selected.map((entry) => [entry.playlist.id, entry.reason, entry.number]),
    ).toEqual([["b", "include", null]]);
    expect(skipped[0]).toMatchObject({ reason: "excluded" });
  });

  it("puts unnumbered issues last and reports unknown ids", () => {
    const result = selectPlaylists(
      [playlistDto("x", "Pivəəkly extra"), playlistDto("y", "Pivəəkly 9")],
      "me-user",
      { ...rules, exclude: ["ghost"] },
    );
    expect(result.selected.map((entry) => entry.playlist.id)).toEqual([
      "y",
      "x",
    ]);
    expect(result.unknownIds).toEqual(["ghost"]);
  });
});

describe("formatSelectionReport", () => {
  it("explains inclusions, exclusions, gaps and unnumbered issues", () => {
    const selection = selectPlaylists(
      [
        playlistDto("a", "Pivəəkly 1"),
        playlistDto("b", "Pivəəkly 4"),
        playlistDto("c", "Pivəəkly Rarities"),
        playlistDto("d", "Piveekly 5"),
        playlistDto("e", "Gym"),
        playlistDto("f", "Pivəəkly 4 bis"),
      ],
      "me-user",
      { ...rules, exclude: ["f"] },
    );
    const text = formatSelectionReport(selection, "Pivəəkly").join("\n");
    expect(text).toContain("Included (3)");
    expect(text).toContain("Pivəəkly Rarities");
    expect(text).toContain("has no number");
    expect(text).toContain("Numbers missing from the series: 2, 3");
    expect(text).toContain("Piveekly 5");
    expect(text).toContain("U+0259");
    expect(text).toContain("excluded in playlists.config.ts");
    expect(text).toContain("1 more playlists");
    expect(text).not.toContain("Gym");
  });

  it("flags duplicate numbers", () => {
    const selection = selectPlaylists(
      [playlistDto("a", "Pivəəkly 2"), playlistDto("b", "Pivəəkly #2")],
      "me-user",
      rules,
    );
    expect(formatSelectionReport(selection, "Pivəəkly").join("\n")).toContain(
      "No. 2 appears in more than one playlist",
    );
  });
});
