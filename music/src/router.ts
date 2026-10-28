import { site } from "@site";
import { watch } from "vue";
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

import { i18n } from "./i18n/index.ts";
import { playlistRepository } from "./repositories/PlaylistRepository.ts";
import HomeView from "./views/HomeView.vue";

/**
 * Finds an artist's name in the published tracks.
 * @param id - Spotify artist id
 * @returns The name, if the artist is credited anywhere
 */
function artistName(id: string): string | undefined {
  for (const playlist of playlistRepository.all()) {
    for (const track of playlist.tracks) {
      const artist = track.artists.find((entry) => entry.id === id);
      if (artist) return artist.name;
    }
  }
  return undefined;
}

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: { title: () => undefined },
  },
  {
    path: "/playlist/:id",
    name: "playlist",
    component: () => import("./views/PlaylistView.vue"),
    props: true,
    meta: { title: (id: string) => playlistRepository.byId(id)?.name },
  },
  {
    path: "/stats",
    name: "stats",
    component: () => import("./views/StatsView.vue"),
    meta: { title: () => i18n.global.t("nav.stats") },
  },
  {
    path: "/series",
    name: "series",
    component: () => import("./views/SeriesView.vue"),
    meta: { title: () => i18n.global.t("nav.series") },
  },
  {
    path: "/artist/:id",
    name: "artist",
    component: () => import("./views/ArtistView.vue"),
    props: true,
    meta: { title: artistName },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("./views/NotFoundView.vue"),
    meta: { title: () => i18n.global.t("notFound.title") },
  },
];

/** The app router; clean URLs, with GitHub Pages serving 404.html as the SPA fallback. */
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
});

/**
 * Sets the document title from the current route, in the current language.
 * @returns Nothing
 */
function updateTitle(): void {
  const route = router.currentRoute.value;
  const id = typeof route.params.id === "string" ? route.params.id : "";
  const title = route.meta.title?.(id);
  if (!title) document.title = `${site.series} · ${site.domain}`;
  else
    document.title = title.includes(site.series)
      ? `${title} · ${site.domain}`
      : `${title} · ${site.series}`;
}

router.afterEach(updateTitle);
watch(i18n.global.locale, updateTitle);
