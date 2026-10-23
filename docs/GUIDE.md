# Pivəəkly guide

Everything needed to run, sync and publish music.pivi.dev.

1. [Spotify app](#1-spotify-app)
2. [First run](#2-first-run)
3. [Commands](#3-commands)
4. [Choosing the Pivəəkly](#4-choosing-the-pivəəkly)
5. [When the token expires](#5-when-the-token-expires)
6. [Architecture](#6-architecture)
7. [Versioning](#7-versioning)
8. [Localization](#8-localization)
9. [Security](#9-security)

## 1. Spotify app

The app already exists. If it ever has to be recreated:

1. Go to <https://developer.spotify.com/dashboard> and create an app ("Web API").
2. Under **Redirect URIs** add a loopback address, for example `http://127.0.0.1:8888/callback`.
   Spotify no longer accepts `localhost`: use `127.0.0.1`.
3. Keep the app in **Development Mode**. The owner needs **Spotify Premium**, and playlist
   contents are only readable for playlists you own or collaborate on.
4. Copy the **Client ID** and **Client secret** into `.env`.

Constraints of the current Web API that the sync follows:

- playlist contents come from `GET /playlists/{id}/items`; in the JSON `tracks` became `items`
  and `items[].track` became `items[].item` (the old name is still accepted);
- audio-features, audio-analysis, recommendations, related-artists, artist top-tracks and the
  batch endpoints no longer exist, and `popularity`, `followers` and `label` are not used;
- only the top 30 artists are fetched one by one (`GET /artists/{id}`), for their pictures.

## 2. First run

```bash
pnpm install
cp .env.example .env    # fill in SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
pnpm auth               # authorize once; saves SPOTIFY_REFRESH_TOKEN to .env
pnpm sync               # downloads the playlists and writes music/src/data/*.json
pnpm dev                # http://localhost:5173
```

`SPOTIFY_REDIRECT_URI` must match **exactly** a Redirect URI of the app: `pnpm auth` listens on
that port and path, prints the authorization link and waits for Spotify to redirect back.

Without a login, `pnpm fixtures` writes invented sample issues to `music/src/data/`, and the
site shows a notice saying so.

## 3. Commands

| Command                                                  | What it does                                                                                    |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm auth`                                              | Authorization Code flow with PKCE on a local server; saves the refresh token to `.env`.         |
| `pnpm sync`                                              | Downloads, adapts, sanitizes and writes the data. `pnpm sync -- --no-cache` skips the cache.    |
| `pnpm release`                                           | From `main`: sync, check, build, security scan, then commits only `music/src/data/` and pushes. |
| `pnpm dev`                                               | Web app dev server.                                                                             |
| `pnpm build`                                             | Production build in `music/dist/`, with `404.html` for deep links on GitHub Pages.              |
| `pnpm check`                                             | Type check, lint, format check and unit tests.                                                  |
| `pnpm security:scan`                                     | Looks for tokens, secrets, user ids and forbidden keys in the data and the build.               |
| `pnpm security:audit`                                    | `pnpm audit` of the dependencies.                                                               |
| `pnpm fixtures`                                          | Writes the invented sample data.                                                                |
| `pnpm version:patch` · `version:minor` · `version:major` | Bumps the app version.                                                                          |

The script is called `release` because `deploy` is a built-in pnpm command.

## 4. Choosing the Pivəəkly

The rules live in [`sync/playlists.config.ts`](../sync/playlists.config.ts):

- the starting point is `GET /me/playlists`;
- **only playlists you own** are considered;
- the name must start with `prefix`, `"Pivəəkly"` by default, with two **ə** (U+0259). Names are
  compared NFC-normalized and case-insensitive, so `PIVƏƏKLY` and a decomposed ə match too;
- `exclude`: ids never to publish, whatever their name;
- `include`: ids to publish even when the name does not match (still only if you own them);
- `tags`: optional moods per id, used by the site's filters.

The issue number comes from the name (`Pivəəkly 12`, `Pivəəkly #12`, `Pivəəkly Nº 12`…); a
playlist without one is published last as a special issue. Each sync prints:

- the included playlists and why;
- the skipped ones and why, flagging names that look like the series but do not match (often an
  "e" typed instead of the "ə");
- missing and duplicated numbers, and playlists without a number;
- ids in `include` or `exclude` that match none of your playlists.

The release date of an issue is the earliest `added_at` of its tracks, because Spotify does not
say when a playlist was published. The site marks those dates as approximate.

## 5. When the token expires

The refresh token expires **6 months after authorization**, or when access to the app is
revoked. `pnpm sync` then stops with:

> The Spotify refresh token is no longer valid […]. Run `pnpm auth` again, then `pnpm sync`.

Run `pnpm auth` again. If Spotify rotates the refresh token during a sync, the new one is saved
to `.env` automatically.

## 6. Architecture

```text
music/    web app: reads only the static JSON, knows nothing about the Spotify API
sync/     downloads, adapts and sanitizes the data
shared/   domain model, zod schemas, series and security rules, fixtures
scripts/  release and security scan
```

- **Adapter** (`sync/src/adapter.ts`): maps the Spotify DTOs, validated in
  `sync/src/spotify/schemas.ts`, onto `shared/src/domain.ts`. All API knowledge lives in `sync/`.
- **Client** (`sync/src/spotify/client.ts`): queued requests with a minimum spacing, retries with
  exponential backoff on 429 (honouring `Retry-After`), 5xx and network errors, a token refresh
  on 401, and a disk cache in `.sync-cache/` keyed by each playlist's `snapshot_id`.
- **Repository** (`music/src/repositories/PlaylistRepository.ts`): the only module that imports
  the JSON, enforced by ESLint.
- **Services** (`music/src/services/stats/`): pure, tested functions for summaries, rankings,
  per-year heatmaps, release distribution, timeline gaps, recurring artists, discovery and
  repeated tracks.
- **Strategies** (`music/src/strategies/`): one strategy per sort or filter, composed with
  `sortWith`, `filterWith`, `chainSorts` and `withDirection`.
- **Fuzzy search** (`music/src/utils/fuzzy.ts`): text is folded (no case, no accents, "ə" read as
  "e"), and every query word must match a word by substring, word prefix, typo-tolerant prefix
  (no typos up to 3 letters, 1 up to 6, 2 from 7) or, last, letters in order.
- **UI**: Pinia stores for the theme and the showcase filters; composables for the catalogue,
  accents, cover backdrop and tooltips; components by feature (`playlists/`, `stats/`,
  `series/`, `player/`) and base components in `ui/`, including the `SelectMenu` dropdown and
  the `v-tooltip` directive.

### Design

"Aurora": glass panels over blurred, drifting orbs painted with the colours of the cover in
view. Colours come from the palette extracted at sync time; grey photo covers fall back to aurora
tints, so the page never turns dull. Menus, tooltips and the header use a lighter, more blurred
glass. Headings use Montserrat, the face of the covers; body text uses Inter. Accents are
adjusted to meet WCAG AA contrast in both themes. Loading is animated: a splash record, a
progress bar between pages, shimmering cover and player skeletons, rising sections and counting
figures, all disabled by `prefers-reduced-motion`.

## 7. Versioning

The app follows [Semantic Versioning](https://semver.org). The version is the `version` of the
root `package.json`; the footer shows it, with the commit it was built from, and links to the
[changelog](../CHANGELOG.md). To release a new version of the app (not a data sync):

1. add an entry to `CHANGELOG.md`;
2. run `pnpm version:patch`, `pnpm version:minor` or `pnpm version:major`;
3. commit as `chore(release): vX.Y.Z`, tag `vX.Y.Z` and push both.

Data syncs (`pnpm release`) never change the version.

## 8. Localization

The site is in English (`en-GB`) and Italian (`it-IT`). The first visit follows the browser
language and the menu choice is remembered. Code, URLs and comments are in English; texts live
only in `music/src/i18n/locales/*.json`. A test fails when a key is missing from a language or
when the code uses a key that does not exist.

## 9. Security

The repository is public:

- client ID, client secret and refresh token live only in the gitignored `.env`; no GitHub
  secrets are used;
- the bundle holds no token and never calls Spotify;
- the sanitizer whitelists the domain fields, rejects forbidden keys and removes account and
  collaborator identifiers from playlist names and descriptions;
- `pnpm security:scan` fails on anything that looks like a Spotify token, a Bearer header, a
  hexadecimal id or secret, a user URI or link, a forbidden key or a real `.env` value;
- CI runs `pnpm audit`, and `pnpm-workspace.yaml` refuses packages published less than a week
  ago.
