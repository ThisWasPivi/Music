/*
 * Who the site is for. Change these values to publish your own playlist
 * series: the web app reads them for titles, links and the footer, the
 * build writes `domain` to the CNAME file, and the sync uses `series` as
 * the default playlist name prefix (see `sync/playlists.config.ts`).
 */

/**
 * The person curating the series, linked in the footer.
 * @property name - Display name
 * @property url - Their page
 */
export interface SiteOwner {
  name: string;
  url: string;
}

/**
 * Site identity.
 * @property series - Name of the playlist series, shown in titles
 * @property domain - Domain the site is published on
 * @property description - One-line description for search engines and link previews
 * @property owner - Who curates the series; null hides the footer link
 * @property repository - Source code URL; null hides the source and version links
 */
export interface SiteConfig {
  series: string;
  domain: string;
  description: string;
  owner: SiteOwner | null;
  repository: string | null;
}

/** This site's identity. */
export const site: SiteConfig = {
  series: "Pivəəkly",
  domain: "music.pivi.dev",
  description:
    "Pivəəkly: Pivi's playlist series, with stats and a release timeline.",
  owner: { name: "Pivi", url: "https://linktree.pivi.dev" },
  repository: "https://github.com/ThisWasPivi/Music",
};
