# Changelog

All notable changes to music.pivi.dev. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Data syncs are not listed.

## [Unreleased]

### Changed

- The aurora keeps its default colours on the home, statistics and series pages; only playlist
  and artist pages take the colours of the cover.
- Accent colours fade into the new palette instead of switching at once.
- The release timeline is a calendar: one row per year, numbered dots at each release date,
  close issues stacked instead of overlapping, and the longest pause drawn as a striped stretch.
- The release-year chart shows single years by default, with five-year and decade views.
- Column bars are rounded only at the top.
- Keyboard focus rings are thicker, high-contrast and follow each element's shape.

### Fixed

- A hairline of dark placeholder showed around some covers.
- Dark borders around the timeline dots, their numbers and the artist page's rail dots.
- The focus ring of the header links was clipped.

## [1.2.0] - 2026-10-23

### Changed

- The published data is no longer in git: `pnpm release` uploads it to the `data` GitHub
  Release and starts the deploy, which downloads it before building.
- `pnpm dev`, `pnpm build`, `pnpm check` and `pnpm test` write the sample issues when the data
  is missing, so a fresh clone works straight away.

## [1.1.0] - 2026-10-23

### Added

- Loading animations: a spinning-record splash, a progress bar between pages, shimmering
  skeletons for covers and the Spotify player, sections rising into place and counting figures.
- Floating glass for the header, dropdown menus and tooltips; menus now blur the page behind
  them.
- README in the style of TravelMap, with the detailed setup moved to `docs/GUIDE.md`.

### Fixed

- Text over photo covers was hard to read: the playlist header sits in a glass panel and a wash
  of the page colour keeps the aurora calm.
- Grey photo covers gave grey timeline balls, artist dots and accents: the liveliest cover colour
  is used, or an aurora tint for the issue's place in the series.
- Timeline labels no longer overlap, and keep AA contrast in both themes.
- Artist timeline dots are centred on their card and glow in the issue's colour.

## [1.0.0] - 2026-10-23

### Added

- English and Italian, with a round-flag language menu.
- Themed dropdowns with fuzzy search; fuzzy search in every search box.
- Album covers on every track, cover backdrop filling playlist and artist pages.
- Per-year heatmap that fits the screen, rounded animated bar charts, a colourful release
  timeline and themed tooltips.
- Reworked artist page: album shelf and a timeline of appearances.
- App version and commit in the footer, links to linktree.pivi.dev and to the source code.
- Montserrat, the cover typeface, for headings.

### Changed

- The home page shows only the playlists with search, sort and filters; "In rotation now" moved
  to the stats page.
- English URLs: `/stats`, `/series`, `/artist/:id`.
- The theme button switches in one click.

### Removed

- "Last updated" sorting.
- Jaccard similarity between issues.

## [0.1.0] - 2026-10-23

### Added

- First Aurora release: showcase, playlist pages, stats, series timeline and artist pages.
- Spotify sync with PKCE auth, sanitization, release script, security scan and Pages deploy.
