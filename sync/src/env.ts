import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

import { z } from "zod";

import { SyncError } from "./errors.ts";

/** The repository's `.env`, the only place credentials live. */
export const ENV_PATH = fileURLToPath(new URL("../../.env", import.meta.url));

const envSchema = z.object({
  SPOTIFY_CLIENT_ID: z.string().min(1, "SPOTIFY_CLIENT_ID is missing"),
  SPOTIFY_CLIENT_SECRET: z.string().min(1, "SPOTIFY_CLIENT_SECRET is missing"),
  SPOTIFY_REDIRECT_URI: z.url("SPOTIFY_REDIRECT_URI is not a valid URL"),
  SPOTIFY_REFRESH_TOKEN: z.string().optional(),
});

/** The validated Spotify settings. */
export type SpotifyEnv = z.infer<typeof envSchema>;

/**
 * Reads and validates `.env`.
 * @param path - File to read, the repository `.env` by default
 * @returns The settings
 */
export async function loadEnv(path: string = ENV_PATH): Promise<SpotifyEnv> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    throw new SyncError(
      `${path} not found: copy .env.example to .env and fill in your Spotify app values.`,
    );
  }
  const result = envSchema.safeParse(parseEnv(text));
  if (!result.success) {
    throw new SyncError(
      `Invalid .env: ${result.error.issues.map((issue) => issue.message).join(", ")}.`,
    );
  }
  return {
    ...result.data,
    SPOTIFY_REFRESH_TOKEN: result.data.SPOTIFY_REFRESH_TOKEN || undefined,
  };
}

/**
 * Sets one variable in an env file's text, keeping every other line as is.
 * @param text - Current file contents
 * @param key - Variable name
 * @param value - New value
 * @returns The updated contents
 */
export function setEnvValue(text: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(text)) return text.replace(pattern, () => line);
  return `${text}${text === "" || text.endsWith("\n") ? "" : "\n"}${line}\n`;
}

/**
 * Persists a value into `.env`.
 * @param key - Variable name
 * @param value - New value
 * @param path - File to update, the repository `.env` by default
 * @returns Resolves once written
 */
export async function writeEnvValue(
  key: string,
  value: string,
  path: string = ENV_PATH,
): Promise<void> {
  const text = await readFile(path, "utf8").catch(() => "");
  await writeFile(path, setEnvValue(text, key, value), { mode: 0o600 });
}
