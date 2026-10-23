# Changelog

All notable changes to music.pivi.dev. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Data syncs are not listed.

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
