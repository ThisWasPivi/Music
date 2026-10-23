<script setup lang="ts">
/**
 * AppHeader component
 * Sticky glass bar with the logo, the main navigation, the language menu
 * and the theme toggle.
 */
import { useI18n } from "vue-i18n";

import BrandMark from "./BrandMark.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import ThemeToggle from "./ThemeToggle.vue";

const { t } = useI18n();
const LINKS = [
  { to: { name: "home" }, key: "nav.playlists" },
  { to: { name: "stats" }, key: "nav.stats" },
  { to: { name: "series" }, key: "nav.series" },
] as const;
</script>

<template>
  <header class="header">
    <div class="header__bar glass-pop">
      <RouterLink
        :to="{ name: 'home' }"
        class="header__brand"
        :aria-label="t('nav.home')"
      >
        <BrandMark />
      </RouterLink>
      <nav :aria-label="t('nav.main')" class="header__nav">
        <RouterLink
          v-for="link in LINKS"
          :key="link.key"
          :to="link.to"
          class="header__link"
        >
          {{ t(link.key) }}
        </RouterLink>
      </nav>
      <div class="header__tools">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: env(safe-area-inset-top, 0px);
  z-index: 30;
  padding: 12px var(--gutter) 0;
}
.header__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 14px;
  border-radius: 999px;
  max-inline-size: 1200px;
  margin-inline: auto;
}
.header__brand {
  display: block;
  flex: none;
  block-size: 34px;
  color: var(--text);
  border-radius: 8px;
}
.header__nav {
  display: flex;
  gap: 2px;
  margin-inline: auto;
  overflow-x: auto;
  scrollbar-width: none;
}
.header__link {
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--muted);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition:
    color 150ms ease,
    background 150ms ease;
}
.header__link:hover {
  color: var(--text);
}
.header__link.router-link-active {
  color: var(--text);
  background: var(--glass);
}
.header__tools {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}
@media (max-width: 480px) {
  .header__bar {
    padding-left: 10px;
  }
  .header__link {
    padding: 8px 8px;
    font-size: 13px;
  }
}
</style>
