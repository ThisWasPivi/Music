# music.pivi.dev

A static showcase of the **Pivəəkly** Spotify playlist series: every issue with its cover and
player, stats, a release timeline, recurring artists. The site never calls the Spotify API and
holds no credentials. `pnpm sync` downloads the data locally, cleans it and commits it as JSON,
then GitHub Actions builds and publishes the site on GitHub Pages.

- **Site:** <https://music.pivi.dev> — in English and Italian (round-flag menu in the header)
- **Stack:** pnpm workspace, Vue 3 (`<script setup>`) with strict TypeScript, Vite, Tailwind CSS
  v4 plus native CSS, Pinia, Vue Router, vue-i18n, Vitest, zod, remeda.

## Contents

- [Requirements](#requirements)
- [Spotify app setup](#spotify-app-setup)
- [First run](#first-run)
- [Commands](#commands)
- [How the Pivəəkly are selected](#how-the-pivəəkly-are-selected)
- [When the token expires](#when-the-token-expires)
- [Architecture](#architecture)
- [Localization](#localization)
- [Versioning](#versioning)
- [Security](#security)
- [Deploy](#deploy)

## Requirements

- Node.js ≥ 22.22 and pnpm ≥ 10.28 (`corepack enable` uses the version pinned in `package.json`).
- A **Spotify Premium** account: since 2026, apps in _Development Mode_ only work when the app
  owner has Premium.

## Spotify app setup

The app already exists. If it ever has to be recreated:

1. Go to <https://developer.spotify.com/dashboard> and create an app ("Web API").
2. Under **Redirect URIs** add a loopback address, for example `http://127.0.0.1:8888/callback`.
   Spotify no longer accepts `localhost`: use `127.0.0.1`.
3. The app stays in **Development Mode**: the owner needs Premium, and playlist contents are only
   readable for playlists you own or collaborate on.
4. Copy the **Client ID** and **Client secret** from the app settings.

Constraints of the current API the code follows: playlist endpoints are `/playlists/{id}/items`
(in the JSON `tracks` → `items`, `items[].track` → `items[].item`); audio-features,
recommendations, related-artists, artist top-tracks and the batch endpoints no longer exist;
`popularity`, `followers` and `label` are not used.

## First run

```sh
pnpm install
cp .env.example .env    # then fill in SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
pnpm auth               # runs the authorization flow and saves the refresh token to .env
pnpm sync               # downloads the playlists and writes music/src/data/*.json
pnpm dev                # http://localhost:5173
```

`SPOTIFY_REDIRECT_URI` must match **exactly** one of the Redirect URIs registered on the app:
`pnpm auth` listens on that very port and path.

You can work on the design without logging in: `pnpm fixtures` regenerates `music/src/data/`
with invented Pivəəkly issues. When the data comes from the fixtures, the site says so.

## Commands

| Command                                                  | What it does                                                                                                                                                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm auth`                                              | Authorization Code flow with PKCE on a local server; saves `SPOTIFY_REFRESH_TOKEN` to `.env`. Run it the first time and when the token expires.                                                                       |
| `pnpm sync`                                              | Downloads playlists, tracks, artists and "in rotation", maps them to the domain model, extracts cover palettes, sanitizes and writes `music/src/data/*.json`. `pnpm sync -- --no-cache` ignores the cache.            |
| `pnpm release`                                           | From `main`: `sync`, then typecheck, lint, format, test, build and security scan; if everything passes it commits **only** `music/src/data/` (`chore(data): sync YYYY-MM-DD`) and pushes. The push starts the deploy. |
| `pnpm dev`                                               | Web app dev server.                                                                                                                                                                                                   |
| `pnpm build`                                             | Production build in `music/dist` (with `404.html` for routing on GitHub Pages).                                                                                                                                       |
| `pnpm check`                                             | typecheck + lint + format:check + test.                                                                                                                                                                               |
| `pnpm test`                                              | Vitest unit tests of every package.                                                                                                                                                                                   |
| `pnpm security:scan`                                     | Looks for tokens, secrets, user ids and forbidden keys in `music/src/data` and `music/dist`.                                                                                                                          |
| `pnpm security:audit`                                    | `pnpm audit` of the dependencies.                                                                                                                                                                                     |
| `pnpm fixtures`                                          | Writes the invented sample data.                                                                                                                                                                                      |
| `pnpm version:patch` / `version:minor` / `version:major` | Bumps the app version (see [Versioning](#versioning)).                                                                                                                                                                |

The name `deploy` is not used because it is a built-in pnpm command.

## How the Pivəəkly are selected

The rules live in [`sync/playlists.config.ts`](sync/playlists.config.ts):

- the starting point is `GET /me/playlists`;
- **only playlists you own** are considered;
- the name must start with `prefix` (default `"Pivəəkly"`, with two **ə**, U+0259). The
  comparison runs on NFC-normalized, case-insensitive strings, so `PIVƏƏKLY` and names typed
  with a decomposed ə work too;
- `exclude`: ids never to publish, whatever their name;
- `include`: ids to publish even when the name does not match (still only if you own them);
- `tags`: optional moods per id, used by the site's filters.

The issue number comes from the name (`Pivəəkly 12`, `Pivəəkly #12`, `Pivəəkly Nº 12`…). A
playlist without a number is published last, as a special issue.

Every `sync` prints a summary with:

- the included playlists and why;
- the skipped playlists and why: excluded in the config, not the owner, or a name that looks
  like the series but does not match (often an "e" instead of the "ə");
- numbers missing from the sequence, duplicated numbers and playlists without a number;
- ids in `include`/`exclude` that match none of your playlists.

No playlist outside these rules ever reaches the published JSON.

The "release" date of an issue is the earliest `added_at` of its tracks: Spotify does not expose
when a playlist was published, and the site says so next to the dates.

## When the token expires

The Spotify refresh token expires **6 months after authorization** (or when you revoke access to
the app). `pnpm sync` then stops with:

> The Spotify refresh token is no longer valid […]. Run `pnpm auth` again, then `pnpm sync`.

Just run `pnpm auth` again. If Spotify rotates the refresh token during a sync, the new value is
saved to `.env` automatically.

## Architecture

```
music/    Vue web app: reads only the static JSON, knows nothing about the Spotify API
sync/     Node scripts that download, adapt and sanitize the data
shared/   domain model, zod schemas, series and security rules, fixtures
scripts/  release and security scan
```

Design patterns:

- **Adapter** (`sync/src/adapter.ts`): maps the Spotify DTOs (validated with zod in
  `sync/src/spotify/schemas.ts`) onto the model in `shared/src/domain.ts`. All Spotify API
  knowledge lives in `sync/`.
- **Spotify client** (`sync/src/spotify/client.ts`):
  - queued requests with a minimum spacing;
  - retries with exponential backoff on 429 (honouring `Retry-After`), on 5xx and network errors;
  - token refresh on 401;
  - disk cache in `.sync-cache/`: tracks are keyed by `snapshot_id`, so only changed playlists
    are downloaded again; artists and palettes expire.
- **Repository** (`music/src/repositories/PlaylistRepository.ts`): the only module that imports
  the JSON; an ESLint rule enforces it.
- **Pure service layer** (`music/src/services/stats/`): summaries, rankings, per-year heatmaps,
  year/decade distribution, timeline and gaps, recurring artists, discovery index, repeated
  tracks. Pure functions, tested with Vitest.
- **Strategy** (`music/src/strategies/`): every sort or filter is a strategy, combined with
  `sortWith`/`filterWith` and `chainSorts`/`withDirection`.
- **Fuzzy search** (`music/src/utils/fuzzy.ts`): every search box and dropdown matches with the
  same rules. Text is folded (no case, no accents, "ə" read as "e"); every query word must match
  a word of the text, by substring, word prefix, typo-tolerant prefix (no typos up to 3 letters,
  1 up to 6, 2 from 7) or, last, letters in order.
- **Pinia** for UI state (theme, showcase sort and filters); **composables** for reusable logic
  (`useCatalog`, `useAccent`, `useBackdrop`, `useTooltip`); components by feature
  (`playlists/`, `stats/`, `series/`, `player/`) plus the base ones in `ui/` (`SelectMenu`
  dropdown with fuzzy search, themed tooltip, language and theme switchers).

The "Aurora" design: glass panels over blurred, drifting orbs painted with the colours of the
cover in view (extracted during the sync with `sharp`); on playlist and artist pages the cover
itself, blurred, fills the whole page. Display type is Montserrat, the face of the covers; body
text is Inter. Light and dark themes (automatic, or chosen with the header button); accents are
adjusted to always meet WCAG AA contrast; keyboard navigable; `prefers-reduced-motion` turns the
animations off. The logo is the vinyl "p" (`music/src/components/ui/BrandMark.vue`,
`music/public/brand/`).

Listening uses the official Spotify embed (no login needed). Attribution: the Spotify logo and
"Listen on Spotify" links next to the content, plus a note in the footer.

### Quality

- ESLint flat config with Vue and TypeScript rules, plus the documentation rules of
  [TravelMap](https://github.com/thisispivi/TravelMap): JSDoc on declarations and comments as
  own-line blocks.
- Prettier.
- Husky + lint-staged on pre-commit and commitlint (Conventional Commits) on commit-msg.

## Localization

The site is in English (`en-GB`) and Italian (`it-IT`). The first visit follows the browser
language; the choice made in the header menu is remembered. All code, URLs and comments are in
English; translations live only in `music/src/i18n/locales/*.json`. A test fails if a key is
missing from one language or if the code uses a key that does not exist. Dates and numbers are
formatted for the active language.

## Versioning

The app follows [Semantic Versioning](https://semver.org). The version is the `version` of the
root `package.json`; the footer shows it with the commit the site was built from, linking to
[`CHANGELOG.md`](CHANGELOG.md). To release a new version of the site (not a data sync):

1. add an entry to `CHANGELOG.md`;
2. run `pnpm version:patch`, `pnpm version:minor` or `pnpm version:major`;
3. commit (`chore(release): vX.Y.Z`) and push to `main`.

Data syncs (`pnpm release`) do not change the version.

## Security

The repository is public, so:

- Client ID, client secret and refresh token live **only** in `.env`, which is gitignored
  (`.env.example` has no values). No GitHub secrets are needed.
- The bundle contains no token and never calls the Spotify API.
- Sanitization is mandatory (`sync/src/sanitize.ts`):
  - data passes through the domain zod schemas, which drop every undeclared key (`added_by`,
    owners, collaborator ids…);
  - a second check rejects forbidden keys;
  - the account's id and name and collaborators' ids are removed from playlist names and
    descriptions.
- `pnpm security:scan` (in `release` and in CI) fails if `music/src/data/` or `music/dist/`
  contain strings that look like Spotify tokens, Bearer headers, hexadecimal ids or secrets, user
  URIs or links, forbidden keys, or the real values of your `.env`.
- `pnpm audit` runs in CI. `pnpm-workspace.yaml` refuses packages published less than a week ago.

## Deploy

`.github/workflows/deploy.yml` runs on every push to `main` and on `workflow_dispatch`:

1. install, `pnpm audit`, typecheck, lint, format, test, build, security scan;
2. `actions/upload-pages-artifact` and `actions/deploy-pages`.

There is no `gh-pages` branch: GitHub Pages is set to "GitHub Actions". The custom domain is in
`music/public/CNAME` (`music.pivi.dev`), so Vite uses `base: "/"`. On pull requests the workflow
only verifies.
