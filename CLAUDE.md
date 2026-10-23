# Claude repository instructions

- Workspace: `music/` (Vue webapp), `sync/` (Spotify sync, the only code that knows the Spotify API), `shared/` (domain model, schemas, series and security rules), `scripts/`.
- Conventions follow TravelMap: JSDoc on every named declaration, block comments on their own line (no `//`), sorted imports, Prettier formatting. ESLint enforces them.
- The UI reads data only through `PlaylistRepository`; statistics are pure functions in `music/src/services/stats`; sorting and filtering are strategies in `music/src/strategies`.
- Never commit `.env`, tokens or real user identifiers. Published data must pass `sync/src/sanitize.ts` and `pnpm security:scan`.
- Before finishing: `pnpm check`, `pnpm build`, `pnpm security:scan`.
