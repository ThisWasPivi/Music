import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/design-lab" },
  {
    path: "/design-lab",
    name: "design-lab",
    component: () => import("./design-lab/DesignLabView.vue"),
  },
];

/*
 * The standalone lab preview is opened from arbitrary paths, where only hash
 * URLs survive a reload; the site itself uses clean URLs.
 */
export const router = createRouter({
  history:
    import.meta.env.MODE === "lab"
      ? createWebHashHistory()
      : createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
});
