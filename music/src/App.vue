<script setup lang="ts">
/**
 * App component
 * Shell: skip link, aurora backdrop, header, the active page, footer and
 * the shared tooltip.
 */
import { useI18n } from "vue-i18n";

import AppFooter from "@/components/ui/AppFooter.vue";
import AppHeader from "@/components/ui/AppHeader.vue";
import AppTooltip from "@/components/ui/AppTooltip.vue";
import AuroraBackdrop from "@/components/ui/AuroraBackdrop.vue";
import RouteProgress from "@/components/ui/RouteProgress.vue";
import SampleDataNotice from "@/components/ui/SampleDataNotice.vue";
import { useThemeStore } from "@/stores/theme.ts";

useThemeStore();
const { t } = useI18n();
</script>

<template>
  <RouteProgress />
  <a href="#main" class="skip">{{ t("app.skip") }}</a>
  <AuroraBackdrop />
  <AppHeader />
  <div class="notice-wrap"><SampleDataNotice /></div>
  <main id="main" tabindex="-1" class="main">
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </main>
  <AppFooter />
  <AppTooltip />
</template>

<style scoped>
.skip {
  position: absolute;
  inset: 8px auto auto 8px;
  z-index: 100;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--text);
  color: var(--bg);
  transform: translateY(-200%);
}
.skip:focus {
  transform: none;
}
.notice-wrap {
  padding-inline: var(--gutter);
}
.main {
  max-inline-size: calc(1200px + 2 * var(--gutter));
  margin: 24px auto 0;
  padding-inline: max(var(--gutter), env(safe-area-inset-left, 0px))
    max(var(--gutter), env(safe-area-inset-right, 0px));
  outline: none;
}
.page-enter-active,
.page-leave-active {
  transition:
    opacity 200ms ease,
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-to {
  opacity: 0;
}
</style>
