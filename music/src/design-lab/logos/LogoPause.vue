<script setup lang="ts">
/**
 * LogoPause component
 * "p" followed by the two i's side by side as a pause sign; on hover or
 * focus the bars morph into the play triangle. Browsers that cannot
 * animate the `d` property swap the shapes without the transition.
 */
import { computed, ref } from "vue";

withDefaults(
  defineProps<{
    /** Accessible name. */
    title?: string;
  }>(),
  { title: "pivi" },
);

const PAUSE = [
  "M78 20 L92 20 L92 68 L78 68 Z",
  "M102 20 L116 20 L116 68 L102 68 Z",
] as const;
const PLAY = [
  "M78 20 L101 32 L101 56 L78 68 Z",
  "M101 32 L124 44 L124 44 L101 56 Z",
] as const;

const playing = ref(false);
const shapes = computed(() => (playing.value ? PLAY : PAUSE));
</script>

<template>
  <svg
    class="logo"
    :class="{ 'logo--playing': playing }"
    viewBox="0 0 128 100"
    role="img"
    :aria-label="title"
    @mouseenter="playing = true"
    @mouseleave="playing = false"
  >
    <rect x="2" y="20" width="14" height="78" rx="4" fill="currentColor" />
    <circle
      cx="40"
      cy="44"
      r="19"
      fill="none"
      stroke="currentColor"
      stroke-width="13"
    />
    <path class="logo__left" :d="shapes[0]" />
    <path class="logo__right" :d="shapes[1]" />
  </svg>
</template>

<style scoped>
.logo {
  display: block;
  block-size: 100%;
  inline-size: auto;
}
.logo path {
  fill: var(--logo-accent, currentColor);
  stroke: var(--logo-accent, currentColor);
  stroke-width: 3;
  stroke-linejoin: round;
  transition: d 260ms cubic-bezier(0.3, 0.7, 0.2, 1);
}
.logo__left {
  d: path("M78 20 L92 20 L92 68 L78 68 Z");
}
.logo__right {
  d: path("M102 20 L116 20 L116 68 L102 68 Z");
}
.logo--playing .logo__left {
  d: path("M78 20 L101 32 L101 56 L78 68 Z");
}
.logo--playing .logo__right {
  d: path("M101 32 L124 44 L124 44 L101 56 Z");
}
@media (prefers-reduced-motion: reduce) {
  .logo path {
    transition: none;
  }
}
</style>
