import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { loadEnv, setEnvValue, writeEnvValue } from "./env.ts";

describe("setEnvValue", () => {
  it("replaces an existing line and keeps the others", () => {
    expect(
      setEnvValue(
        "A=1\nSPOTIFY_REFRESH_TOKEN=old\nB=2\n",
        "SPOTIFY_REFRESH_TOKEN",
        "new",
      ),
    ).toBe("A=1\nSPOTIFY_REFRESH_TOKEN=new\nB=2\n");
  });

  it("appends a missing variable", () => {
    expect(setEnvValue("A=1", "B", "2")).toBe("A=1\nB=2\n");
    expect(setEnvValue("", "B", "2")).toBe("B=2\n");
  });

  it("does not interpret $ in the value", () => {
    expect(setEnvValue("K=x\n", "K", "a$&b")).toBe("K=a$&b\n");
  });
});

describe("loadEnv", () => {
  it("validates and round-trips through writeEnvValue", async () => {
    const dir = await mkdtemp(join(tmpdir(), "env-"));
    const path = join(dir, ".env");
    await writeFile(
      path,
      "SPOTIFY_CLIENT_ID=id\nSPOTIFY_CLIENT_SECRET=secret\nSPOTIFY_REDIRECT_URI=http://127.0.0.1:8888/callback\nSPOTIFY_REFRESH_TOKEN=\n",
    );
    expect((await loadEnv(path)).SPOTIFY_REFRESH_TOKEN).toBeUndefined();
    await writeEnvValue("SPOTIFY_REFRESH_TOKEN", "tok", path);
    expect((await loadEnv(path)).SPOTIFY_REFRESH_TOKEN).toBe("tok");
    expect(await readFile(path, "utf8")).toContain("SPOTIFY_CLIENT_ID=id");
  });

  it("explains a missing file or value", async () => {
    await expect(loadEnv("/nonexistent/.env")).rejects.toThrow(
      /\.env\.example/,
    );
    const dir = await mkdtemp(join(tmpdir(), "env-"));
    const path = join(dir, ".env");
    await writeFile(path, "SPOTIFY_CLIENT_ID=\n");
    await expect(loadEnv(path)).rejects.toThrow(/SPOTIFY_CLIENT_ID/);
  });
});
