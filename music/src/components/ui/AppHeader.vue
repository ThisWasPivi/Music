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

import { usePalette } from "@/composables/usePalette.ts";
import { useSurprise } from "@/composables/useSurprise.ts";

import AppIcon, { type IconName } from "./AppIcon.vue";
import BrandMark from "./BrandMark.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import ThemeToggle from "./ThemeToggle.vue";

const { t } = useI18n();
const palette = usePalette();
const surprise = useSurprise();
/* The shortcut shown in the search tooltip, by platform. */
const shortcut =
  typeof navigator !== "undefined" && /Mac|iP(hone|ad)/.test(navigator.platform)
    ? "⌘K"
    : "Ctrl K";

/**
 * One section in the navigation.
 * @property to - Route
 * @property key - Label
 * @property short - Shorter label for the phone tab bar
 * @property icon - Tab bar icon
 */
interface NavLink {
  to: { name: string };
  key: string;
  short?: string;
  icon: IconName;
}

const LINKS: readonly NavLink[] = [
  { to: { name: "home" }, key: "nav.playlists", icon: "grid" },
  {
    to: { name: "stats" },
    key: "nav.stats",
    short: "nav.statsShort",
    icon: "chart",
  },
  { to: { name: "series" }, key: "nav.series", icon: "timeline" },
  { to: { name: "years" }, key: "nav.years", icon: "sparkle" },
  { to: { name: "covers" }, key: "nav.covers", icon: "wall" },
];
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
        <button
          v-tooltip="t('search.tooltip', { shortcut })"
          type="button"
          class="tool"
          :aria-label="t('search.title')"
          @click="palette.show()"
        >
          <AppIcon name="search" />
        </button>
        <button
          v-tooltip="t('surprise.hint')"
          type="button"
          class="tool tool--dice"
          :aria-label="t('surprise.label')"
          @click="surprise()"
        >
          <AppIcon name="shuffle" />
        </button>
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
        <span>{{ t(link.short ?? link.key) }}</span>
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
.tool {
  display: grid;
  place-items: center;
  inline-size: 40px;
  block-size: 40px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  color: var(--text);
  font-size: 17px;
  transition:
    background 160ms ease,
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tool:hover {
  background: var(--glass-strong);
  transform: translateY(-1px);
}
.tool--dice:active {
  transform: rotate(-20deg) scale(0.92);
}
/* The narrowest phones keep the dice in the search palette only. */
@media (max-width: 380px) {
  .tool--dice {
    display: none;
  }
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
}
@media (max-width: 360px) {
  .tabs {
    inset-inline: 8px;
    gap: 2px;
  }
  .tabs__link {
    padding-inline: 2px;
    font-size: 10.5px;
  }
  .tabs__link.router-link-active .tabs__icon {
    color: var(--accent);
  }
}
</style>
