<script setup lang="ts">
/**
 * AppHeader component
 * Sticky glass bar with the logo, the main navigation, the language menu
 * and the theme toggle. On phones the navigation moves to a floating tab
 * bar at the bottom of the screen, with an icon over each label, so every
 * section stays in reach of the thumb and nothing is cut off.
 */
import { site } from "@site";
import { useI18n } from "vue-i18n";

import AppIcon from "./AppIcon.vue";
import BrandMark from "./BrandMark.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import ThemeToggle from "./ThemeToggle.vue";

const { t } = useI18n();
const LINKS = [
  { to: { name: "home" }, key: "nav.playlists", icon: "grid" },
  { to: { name: "stats" }, key: "nav.stats", icon: "chart" },
  { to: { name: "series" }, key: "nav.series", icon: "timeline" },
] as const;
</script>

<template>
  <header class="header">
    <div class="header__bar glass-pop">
      <RouterLink
        :to="{ name: 'home' }"
        class="header__brand"
        :aria-label="t('nav.home', { site: site.series })"
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
    <!-- Outside the glass bar: its backdrop filter would trap a fixed child. -->
    <nav :aria-label="t('nav.main')" class="tabs glass-pop">
      <RouterLink
        v-for="link in LINKS"
        :key="link.key"
        :to="link.to"
        class="tabs__link"
      >
        <AppIcon :name="link.icon" class="tabs__icon" />
        <span>{{ t(link.key) }}</span>
      </RouterLink>
    </nav>
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
  /* Room for the focus ring, which the scrolling strip would otherwise clip. */
  padding: 7px;
  margin-block: -7px;
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
  background: color-mix(in oklab, var(--glass) 60%, transparent);
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
.tabs {
  display: none;
}
@media (max-width: 640px) {
  .header__bar {
    justify-content: space-between;
    padding-left: 10px;
  }
  .header__nav {
    display: none;
  }
  .tabs {
    position: fixed;
    inset: auto var(--gutter) calc(10px + env(safe-area-inset-bottom, 0px));
    z-index: 30;
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    gap: 4px;
    padding: 6px;
    border-radius: 26px;
    /* More opaque than other floating glass: page text scrolls right under it. */
    background:
      linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent 60%),
      color-mix(in oklab, var(--bg) 90%, transparent);
  }
  .tabs__link {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 7px 4px 6px;
    border-radius: 20px;
    color: var(--muted);
    font-size: 11.5px;
    font-weight: 650;
    text-decoration: none;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
    transition:
      color 150ms ease,
      background 150ms ease,
      transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .tabs__link:active {
    transform: scale(0.94);
  }
  .tabs__link.router-link-active {
    color: var(--text);
    background: var(--glass);
  }
  .tabs__icon {
    font-size: 19px;
  }
  .tabs__link.router-link-active .tabs__icon {
    color: var(--accent);
  }
}
</style>
