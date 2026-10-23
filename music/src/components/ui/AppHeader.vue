<script setup lang="ts">
/**
 * AppHeader component
 * Sticky glass bar with the logo, the main navigation and the theme toggle.
 */
import BrandMark from "./BrandMark.vue";
import ThemeToggle from "./ThemeToggle.vue";

const LINKS = [
  { to: { name: "home" }, label: "Playlist" },
  { to: { name: "stats" }, label: "Statistiche" },
  { to: { name: "series" }, label: "Serie" },
] as const;
</script>

<template>
  <header class="header">
    <div class="header__bar glass">
      <RouterLink
        :to="{ name: 'home' }"
        class="header__brand"
        aria-label="Pivəəkly, home"
      >
        <BrandMark />
      </RouterLink>
      <nav aria-label="Principale" class="header__nav">
        <RouterLink
          v-for="link in LINKS"
          :key="link.label"
          :to="link.to"
          class="header__link"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
      <ThemeToggle />
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
  background: var(--glass-strong);
  max-inline-size: 1200px;
  margin-inline: auto;
}
.header__brand {
  display: block;
  block-size: 34px;
  color: var(--text);
  border-radius: 8px;
}
.header__nav {
  display: flex;
  gap: 2px;
  margin-inline: auto;
  overflow-x: auto;
}
.header__link {
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--muted);
  font-weight: 550;
  text-decoration: none;
  white-space: nowrap;
}
.header__link:hover {
  color: var(--text);
}
.header__link.router-link-active {
  color: var(--text);
  background: var(--glass);
}
@media (max-width: 420px) {
  .header__link {
    padding: 8px 10px;
    font-size: 14px;
  }
}
</style>
