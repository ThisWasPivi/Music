<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./music/public/brand/mark-vinyl-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./music/public/brand/mark-vinyl-light.svg">
    <img alt="Pivəəkly logo: a record player shaped like a p" src="./music/public/brand/mark-vinyl-dark.svg" height="96">
  </picture>
</div>

# [Pivəəkly](https://music.pivi.dev/)

A static showcase of the **Pivəəkly** Spotify playlist series. Every issue with its cover,
tracklist and the official Spotify player, plus statistics, a release timeline that shows the
busy spells and the pauses, recurring artists and repeated tracks. The site never calls the
Spotify API and holds no credentials: a local sync downloads the data, cleans it and uploads it
as JSON to a GitHub Release, and GitHub Actions builds and publishes the site.

![Vue](https://img.shields.io/badge/vue.js-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-%23F69220.svg?style=for-the-badge&logo=pnpm&logoColor=white) ![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/tailwind_css-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Pinia](https://img.shields.io/badge/pinia-FFD859.svg?style=for-the-badge&logo=pinia&logoColor=black) ![Vue i18n](https://img.shields.io/badge/vue_i18n-41B883.svg?style=for-the-badge&logo=vuedotjs&logoColor=white) ![Zod](https://img.shields.io/badge/zod-3E67B1.svg?style=for-the-badge&logo=zod&logoColor=white) ![Vitest](https://img.shields.io/badge/vitest-6E9F18.svg?style=for-the-badge&logo=vitest&logoColor=white) ![Spotify](https://img.shields.io/badge/spotify_web_api-1ED760.svg?style=for-the-badge&logo=spotify&logoColor=black) ![ESLint](https://img.shields.io/badge/eslint-4B3263.svg?style=for-the-badge&logo=eslint&logoColor=white) ![Prettier](https://img.shields.io/badge/prettier-F7B93E.svg?style=for-the-badge&logo=prettier&logoColor=black) ![GitHub Pages](https://img.shields.io/badge/github_pages-222222.svg?style=for-the-badge&logo=github&logoColor=white)

The [live site](https://music.pivi.dev/) shows the real series. A fresh clone ships with invented
sample issues, so the app runs without a Spotify login. Read the [guide](./docs/GUIDE.md) for the
complete setup and release workflow.

## Tech Stack

- **Web app**: Vue 3 with `<script setup>`, Vue Router, Pinia, vue-i18n, and hand-made SVG and
  CSS charts with entrance animations and themed tooltips.
- **Sync**: Node.js scripts with a throttled Spotify Web API client (PKCE auth, retries with
  backoff on 429, disk cache), zod-validated responses and `sharp` for cover palettes.
- **Shared model**: TypeScript domain types, zod schemas, series rules and security rules in the
  `@music/shared` workspace package.
- **Data**: Portable JSON documents for playlists, top artists, rotation and sync metadata.
- **Styling**: Tailwind CSS v4 with native CSS tokens, the "Aurora" glass design, light and dark
  themes, Montserrat and Inter.
- **Internationalization**: vue-i18n with English and Italian interfaces and round-flag
  language menu.
- **Search**: a shared fuzzy matcher for every search box and dropdown.
- **Build system**: Vite, TypeScript, pnpm workspaces, and Node.js 22.
- **Hosting**: GitHub Pages through GitHub Actions, on the music.pivi.dev custom domain.
- **Quality**: ESLint, Prettier, Vitest, Husky, lint-staged, commitlint and a security scan.

## What the site includes

### A showcase of the series

- Every issue as a cover card, with fuzzy search across playlists, tracks, albums and artists.
- Sorting by number, name, track count, duration and cover colour.
- Filters by artist and release decade (themed dropdowns with fuzzy search) and by mood tag.

### A page per issue

- Cover, release and update dates, totals and the official Spotify embed.
- The tracklist with album covers, sortable by every column and fuzzy-filterable.
- Links to the previous and next issue, with the cover glowing behind the whole page.

### Statistics and the series over time

- Headline figures, top artists and albums by tracks or minutes, for the whole series or one
  issue.
- A per-year calendar of when tracks were added and the distribution of release years.
- A real-time release timeline with average, shortest and longest gaps and missing numbers.
- The discovery index (new artists per issue), recurring artists and repeated tracks.
- A page per artist: album shelf and a timeline of every issue they appear in.

Everything works on mobile and desktop, in light and dark themes, in English and Italian, with
keyboard navigation and reduced-motion support.

## How it works

1. `pnpm auth` authorizes the Spotify app once and stores the refresh token in `.env`.
2. `pnpm sync` reads your playlists, keeps the Pivəəkly ones you own and prints why each other
   playlist was skipped.
3. The adapter maps Spotify's JSON onto the domain model; the sanitizer drops anything that
   identifies people.
4. `pnpm release` verifies everything and uploads the JSON to the `data` GitHub Release; the
   data never enters git.
5. GitHub Actions downloads it, checks, builds and deploys the static site to GitHub Pages.

There is no server, database or API call at runtime. Credentials never leave your machine.

## Getting Started

You need [Node.js](https://nodejs.org/) 22.22 or newer and [pnpm](https://pnpm.io/) 10.28 or
newer.

```bash
git clone https://github.com/ThisWasPivi/Music.git
cd Music
pnpm install
pnpm dev
```

Open <http://localhost:5173>. The app starts with invented sample issues and says so on screen.

To publish your own playlists, fill in `.env` from `.env.example`, sign in to the
[GitHub CLI](https://cli.github.com/) with `gh auth login` and run:

```bash
pnpm auth      # once, and again when the token expires (every 6 months)
pnpm release   # sync, verify, upload the data and deploy
```

A **Spotify Premium** account is required: Spotify apps in Development Mode only work for
Premium owners. The [guide](./docs/GUIDE.md#1-spotify-app) covers the app setup.

## Make it yours

The site is not tied to one series. Edit [`site.config.ts`](./site.config.ts) with your series
name, domain, description, footer link and repository; the sync picks playlists whose name starts
with the series name, and the build writes your domain to `CNAME`. See
[Making it yours](./docs/GUIDE.md#making-it-yours).

## Development checks

Run the repository-wide quality gate before pushing:

```bash
pnpm check
pnpm build
pnpm security:scan
pnpm security:audit
```

`pnpm check` runs type checking, linting, formatting and the unit tests of every workspace
package. Git hooks lint staged files before each commit and check commit messages against
Conventional Commits; CI repeats the full suite before every deploy.

### Runtime validation

Spotify's responses are untrusted. `sync/src/spotify/schemas.ts` validates them with zod at the
point they enter the sync, so a changed API fails with the field named instead of publishing
broken data. Before anything is written, `sync/src/sanitize.ts` parses the result through the
domain schemas of `@music/shared`, which keep only declared fields.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main` and on demand. It installs, audits,
type checks, lints, tests, builds and scans the site, then publishes `music/dist/` with
`actions/deploy-pages`. Before building it downloads the published data from the `data` release
(falling back to the sample issues before the first release). There is no `gh-pages` branch, and
no secrets are needed: the workflow's own token reads the release.

Releases of the app itself follow Semantic Versioning: see
[Versioning](./docs/GUIDE.md#7-versioning) and the [changelog](./CHANGELOG.md).

## Your data stays private

- `.env` holds the client ID, client secret and refresh token, and is gitignored.
- `.sync-cache/` keeps raw Spotify responses locally to save API calls, and is gitignored.
- `music/src/data/` holds only the sanitized, public data the site shows, and is gitignored too:
  it is published as a release asset, never committed.

The sanitizer removes `added_by`, owner and collaborator ids and your account name, and the
security scan fails a release if a token, secret or user identifier ever slips into the data or
the built site.

## Documentation

| Guide                                                     | Covers                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| [Guide](./docs/GUIDE.md)                                  | Spotify app, first run, commands, selection, tokens, releases |
| [Spotify app](./docs/GUIDE.md#1-spotify-app)              | Dashboard setup, redirect URI, Premium and API constraints    |
| [Selection](./docs/GUIDE.md#4-choosing-the-pivəəkly)      | How playlists are picked and how to include or exclude one    |
| [Expired token](./docs/GUIDE.md#5-when-the-token-expires) | What to do when the refresh token expires                     |
| [Architecture](./docs/GUIDE.md#6-architecture)            | Adapter, repository, services, strategies, design and search  |
| [Changelog](./CHANGELOG.md)                               | What changed in every version                                 |

## Project Structure

```text
.
├── music/             Vue web app (the published site)
│   ├── public/        Static files: favicon, brand marks
│   └── src/data/      Sanitized JSON (gitignored): sync output or sample issues
├── sync/              Spotify auth, sync, adapter and sanitizer
├── shared/            Domain model, schemas, series and security rules, fixtures
├── scripts/           Release, data fallback and security scan
├── eslint/            Repository-local ESLint rules
└── docs/              Guide
```
