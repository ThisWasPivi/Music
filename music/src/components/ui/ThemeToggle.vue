<script setup lang="ts">
/**
 * ThemeToggle component
 * Cycles the colour scheme between system, light and dark.
 */
import { computed } from "vue";

import { useThemeStore } from "@/stores/theme.ts";

const theme = useThemeStore();
const LABELS = {
  system: "automatico",
  light: "chiaro",
  dark: "scuro",
} as const;
const label = computed(() => `Tema: ${LABELS[theme.choice]}. Cambia tema`);
</script>

<template>
  <button
    type="button"
    class="toggle"
    :aria-label="label"
    :title="label"
    @click="theme.cycle()"
  >
    <svg v-if="theme.choice === 'light'" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path
          d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        />
      </g>
    </svg>
    <svg
      v-else-if="theme.choice === 'dark'"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"
      />
    </svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      />
      <path fill="currentColor" d="M12 3.5a8.5 8.5 0 0 1 0 17z" />
    </svg>
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
.toggle svg {
  inline-size: 18px;
  block-size: 18px;
}
</style>
