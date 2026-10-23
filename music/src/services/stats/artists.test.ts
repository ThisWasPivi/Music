import { describe, expect, it } from "vitest";

import { playlist, track } from "@/test/builders.ts";

import { artistsOf } from "./artists.ts";

describe("artistsOf", () => {
  it("collects each credited artist once", () => {
    const issue = playlist({
      tracks: [
        track({ id: "1", artists: ["a", "b"] }),
        track({ id: "2", artists: ["b"] }),
      ],
    });
    expect([...artistsOf(issue).keys()]).toEqual(["a", "b"]);
  });
});
