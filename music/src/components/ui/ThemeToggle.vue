<script setup lang="ts">
/**
 * ThemeToggle component
 * Switches between light and dark in one click; the icon shows the theme
 * the click leads to.
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useThemeStore } from "@/stores/theme.ts";

const theme = useThemeStore();
const { t } = useI18n();
const label = computed(() =>
  theme.resolved === "dark" ? t("theme.toLight") : t("theme.toDark"),
);
</script>

<template>
  <button
    v-tooltip="label"
    type="button"
    class="toggle"
    :aria-label="label"
    @click="theme.toggle()"
  >
    <Transition name="spin" mode="out-in">
      <svg
        v-if="theme.resolved === 'dark'"
        key="sun"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        </g>
      </svg>
      <svg v-else key="moon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"
        />
      </svg>
    </Transition>
  </button>
</template>

<style scoped>
.toggle {
  display: grid;
  place-items: center;
  inline-size: 40px;
  block-size: 40px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  color: var(--text);
  cursor: pointer;
}
.toggle:hover {
  background: var(--glass-strong);
}
.toggle svg {
  inline-size: 18px;
  block-size: 18px;
}
.spin-enter-active,
.spin-leave-active {
  transition:
    transform 220ms ease,
    opacity 220ms ease;
}
.spin-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}
.spin-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}
</style>
