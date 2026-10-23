<script setup lang="ts">
/**
 * LogoBars component
 * "pivi" where the dotless i's are bars and the v, rotated, is a play
 * triangle: p | ▷ |. Ink is `currentColor`, the triangle `--logo-accent`.
 */
withDefaults(
  defineProps<{
    /** Accessible name. */
    title?: string;
  }>(),
  { title: "pivi" },
);
</script>

<template>
  <svg class="logo" viewBox="0 0 170 100" role="img" :aria-label="title">
    <rect x="2" y="20" width="14" height="78" rx="4" fill="currentColor" />
    <circle
      cx="40"
      cy="44"
      r="19"
      fill="none"
      stroke="currentColor"
      stroke-width="13"
    />
    <rect x="78" y="20" width="14" height="48" rx="4" fill="currentColor" />
    <path
      d="M107 23 L107 65 L141 44 Z"
      fill="var(--logo-accent, currentColor)"
      stroke="var(--logo-accent, currentColor)"
      stroke-width="6"
      stroke-linejoin="round"
    />
    <rect x="154" y="20" width="14" height="48" rx="4" fill="currentColor" />
  </svg>
</template>

<style scoped>
.logo {
  display: block;
  block-size: 100%;
  inline-size: auto;
}
</style>
