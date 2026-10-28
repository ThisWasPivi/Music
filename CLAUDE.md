# Claude repository instructions

- Workspace: `music/` (Vue webapp), `sync/` (Spotify sync, the only code that knows the Spotify API), `shared/` (domain model, schemas, series and security rules), `scripts/`.
- Conventions follow TravelMap: JSDoc on every named declaration, block comments on their own line (no `//`), sorted imports, Prettier formatting. ESLint enforces them.
- The UI reads data only through `PlaylistRepository`; statistics are pure functions in `music/src/services/stats`; sorting and filtering are strategies in `music/src/strategies`.
- Series name, domain, description, owner and repository come only from `site.config.ts` (`@site` in the app); never hard-code them.
- Everything in code, URLs and comments is English; user-facing text goes through vue-i18n and lives only in `music/src/i18n/locales/` (`en-GB`, `it-IT`).
- Search and filters use the shared fuzzy matcher in `music/src/utils/fuzzy.ts`; tooltips use `v-tooltip`, never `title` attributes.
- `music/src/data/` is gitignored: `pnpm release` uploads it to the `data` GitHub Release and the deploy downloads it; `pnpm data:ensure` writes sample data when it is missing. Never commit it.
- Never commit `.env`, tokens or real user identifiers. Published data must pass `sync/src/sanitize.ts` and `pnpm security:scan`.
- Before finishing: `pnpm check`, `pnpm build`, `pnpm security:scan`.
