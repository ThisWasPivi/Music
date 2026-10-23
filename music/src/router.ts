import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

import { playlistRepository } from "./repositories/PlaylistRepository.ts";
import HomeView from "./views/HomeView.vue";

const SITE = "Pivəəkly";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: HomeView, meta: { title: SITE } },
  {
    path: "/playlist/:id",
    name: "playlist",
    component: () => import("./views/PlaylistView.vue"),
    props: true,
    meta: { title: (id: string) => playlistRepository.byId(id)?.name },
  },
  {
    path: "/statistiche",
    name: "stats",
    component: () => import("./views/StatsView.vue"),
    meta: { title: "Statistiche" },
  },
  {
    path: "/serie",
    name: "series",
    component: () => import("./views/SeriesView.vue"),
    meta: { title: "La serie" },
  },
  {
    path: "/artista/:id",
    name: "artist",
    component: () => import("./views/ArtistView.vue"),
    props: true,
    meta: {
      title: (id: string) =>
        playlistRepository
          .all()
          .flatMap((playlist) => playlist.tracks)
          .flatMap((track) => track.artists)
          .find((artist) => artist.id === id)?.name,
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("./views/NotFoundView.vue"),
    meta: { title: "Pagina non trovata" },
  },
];

/** The app router; clean URLs, with GitHub Pages serving 404.html as the SPA fallback. */
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
});

router.afterEach((to) => {
  const { title } = to.meta;
  const id = typeof to.params.id === "string" ? to.params.id : "";
  const resolved = typeof title === "function" ? title(id) : title;
  if (!resolved || resolved === SITE)
    document.title = `${SITE} · music.pivi.dev`;
  else
    document.title = resolved.includes(SITE)
      ? `${resolved} · music.pivi.dev`
      : `${resolved} · ${SITE}`;
});
