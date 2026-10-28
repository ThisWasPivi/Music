import "@fontsource-variable/inter";
import "@fontsource-variable/montserrat";
import "./styles/main.css";

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import { vTooltip } from "./composables/useTooltip.ts";
import { vDragScroll } from "./directives/dragScroll.ts";
import { currentLocale, i18n } from "./i18n/index.ts";
import { router } from "./router.ts";

document.documentElement.lang = currentLocale();
createApp(App)
  .use(createPinia())
  .use(i18n)
  .use(router)
  .directive("tooltip", vTooltip)
  .directive("drag-scroll", vDragScroll)
  .mount("#app");

/* Fade the splash out once the first page is ready, then drop it. */
void router.isReady().then(() => {
  const splash = document.getElementById("splash");
  splash?.classList.add("is-done");
  setTimeout(() => splash?.remove(), 450);
});
