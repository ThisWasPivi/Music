import "@fontsource-variable/inter";
import "@fontsource-variable/montserrat";
import "./styles/main.css";

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import { vTooltip } from "./composables/useTooltip.ts";
import { currentLocale, i18n } from "./i18n/index.ts";
import { router } from "./router.ts";

document.documentElement.lang = currentLocale();
createApp(App)
  .use(createPinia())
  .use(i18n)
  .use(router)
  .directive("tooltip", vTooltip)
  .mount("#app");
