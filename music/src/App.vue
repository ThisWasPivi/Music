<script setup lang="ts">
/**
 * App component
 * Shell: skip link, aurora backdrop, header, the active page and footer.
 */
import AppFooter from "@/components/ui/AppFooter.vue";
import AppHeader from "@/components/ui/AppHeader.vue";
import AuroraBackdrop from "@/components/ui/AuroraBackdrop.vue";
import SampleDataNotice from "@/components/ui/SampleDataNotice.vue";
import { useThemeStore } from "@/stores/theme.ts";

useThemeStore();
</script>

<template>
  <a href="#main" class="skip">Vai al contenuto</a>
  <AuroraBackdrop />
  <AppHeader />
  <div class="notice-wrap"><SampleDataNotice /></div>
  <main id="main" tabindex="-1" class="main">
    <RouterView />
  </main>
  <AppFooter />
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
</style>
