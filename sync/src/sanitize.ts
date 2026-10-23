import {
  artistProfileSchema,
  catalogMetaSchema,
  FORBIDDEN_KEYS,
  playlistSchema,
  rotationSchema,
} from "@music/shared";
import { z } from "zod";

import { SyncError } from "./errors.ts";
import type { PublishedData } from "./output.ts";

const publishedSchema = z.object({
  meta: catalogMetaSchema,
  playlists: z.array(playlistSchema),
  artists: z.array(artistProfileSchema),
  rotation: rotationSchema,
});

/**
 * Lists the paths of forbidden keys anywhere in a value.
 * @param value - Any JSON value
 * @param path - Path of `value`, for reporting
 * @returns Paths such as "playlists.0.tracks.3.added_by"
 */
export function findForbiddenKeys(value: unknown, path = ""): string[] {
  if (Array.isArray(value))
    return value.flatMap((item, index) =>
      findForbiddenKeys(item, `${path}${index}.`),
    );
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...((FORBIDDEN_KEYS as readonly string[]).includes(key)
      ? [`${path}${key}`]
      : []),
    ...findForbiddenKeys(child, `${path}${key}.`),
  ]);
}

/**
 * Removes every occurrence of the given values from a text, ignoring case.
 * @param text - Authored text
 * @param values - Values to remove
 * @returns The redacted text, whitespace tidied
 */
export function redact(text: string, values: readonly string[]): string {
  let result = text;
  for (const value of values) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "giu"), "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

/**
 * The sanitized data and what had to be changed.
 * @property data - Data safe to publish
 * @property warnings - Redactions, to print in the summary
 */
export interface SanitizeResult {
  data: PublishedData;
  warnings: string[];
}

/**
 * Whitelists the data to publish and strips anything that identifies people.
 *
 * Parsing through the domain schemas drops every undeclared key (`added_by`,
 * owners, collaborator ids…). The result is checked again for forbidden
 * keys, and the only text authored on Spotify by people (playlist names and
 * descriptions) is cleaned of the account's and collaborators' ids and name.
 * Track, album and artist names are left alone: they come from the catalogue.
 * @param data - Data built by the adapter
 * @param privateValues - Identifiers of people (owner id and name, collaborator ids)
 * @returns The sanitized data and the redactions made
 */
export function sanitize(
  data: PublishedData,
  privateValues: readonly string[],
): SanitizeResult {
  const parsed = publishedSchema.safeParse(data);
  if (!parsed.success) {
    throw new SyncError(
      `Data cannot be published: ${parsed.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".")} ${issue.message}`)
        .join("; ")}`,
    );
  }

  const keys = findForbiddenKeys(parsed.data);
  if (keys.length > 0)
    throw new SyncError(
      `Forbidden keys in the data: ${keys.slice(0, 5).join(", ")}`,
    );

  /* Very short values (a 2-letter name) would match inside ordinary words. */
  const needles = privateValues.filter((value) => value.trim().length >= 3);
  const warnings: string[] = [];
  const playlists = parsed.data.playlists.map((playlist) => {
    const name = redact(playlist.name, needles);
    const description = redact(playlist.description, needles);
    if (name !== playlist.name || description !== playlist.description) {
      warnings.push(
        `Removed a personal identifier from the name or description of "${name}".`,
      );
    }
    return { ...playlist, name, description };
  });
  return { data: { ...parsed.data, playlists }, warnings };
}
