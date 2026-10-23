/**
 * Rules shared by the sync's sanitizer and the release/CI security scan.
 * Kept free of dependencies so a plain script can import it.
 */

/** Keys that must never appear in published data. */
export const FORBIDDEN_KEYS = [
  "added_by",
  "owner",
  "display_name",
  "email",
  "user",
  "user_id",
  "collaborators",
  "followers",
  "country",
  "product",
  "access_token",
  "refresh_token",
  "client_secret",
  "client_id",
] as const;

/**
 * A suspicious match.
 * @property rule - Which rule matched
 * @property excerpt - The match, truncated so a real secret is not echoed in full
 */
export interface SecretFinding {
  rule: string;
  excerpt: string;
}

const PATTERNS: readonly { rule: string; pattern: RegExp }[] = [
  { rule: "Spotify access token", pattern: /\bBQ[A-Za-z0-9_-]{60,}/g },
  { rule: "Spotify refresh token", pattern: /\bAQ[A-Za-z0-9_-]{60,}/g },
  { rule: "Bearer header", pattern: /Bearer\s+[A-Za-z0-9._-]{20,}/g },
  {
    rule: "Client id/secret (32 hex)",
    pattern: /(?<![\w-])[0-9a-f]{32}(?![\w-])/g,
  },
  { rule: "Spotify user URI", pattern: /spotify:user:[^\s"']+/g },
  {
    rule: "Spotify user link",
    pattern:
      /(?:open\.spotify\.com\/user\/|api\.spotify\.com\/v1\/users\/)[^\s"'/]+/g,
  },
  {
    rule: "Env variable",
    pattern: /SPOTIFY_(?:CLIENT_SECRET|REFRESH_TOKEN)\s*=\s*\S+/g,
  },
  {
    rule: "Forbidden JSON key",
    pattern: new RegExp(`"(?:${FORBIDDEN_KEYS.join("|")})"\\s*:`, "g"),
  },
];

/**
 * Truncates a match for safe logging.
 * @param value - The matched text
 * @returns The first characters followed by an ellipsis
 */
function excerpt(value: string): string {
  return value.length > 14 ? `${value.slice(0, 10)}…` : value;
}

/**
 * Scans text for token-like strings, user identifiers and forbidden keys.
 * @param text - File contents
 * @param literals - Exact values that must not appear (e.g. the real .env values)
 * @returns Every finding
 */
export function findSecrets(
  text: string,
  literals: readonly string[] = [],
): SecretFinding[] {
  const findings: SecretFinding[] = [];
  for (const { rule, pattern } of PATTERNS) {
    for (const match of text.matchAll(pattern))
      findings.push({ rule, excerpt: excerpt(match[0]) });
  }
  for (const literal of literals) {
    if (literal.length >= 8 && text.includes(literal))
      findings.push({ rule: "Valore di .env", excerpt: excerpt(literal) });
  }
  return findings;
}
