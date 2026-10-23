<script setup lang="ts">
/**
 * SpotifyLink component
 * "Listen on Spotify" button with the Spotify icon, as the brand
 * guidelines ask for links back to Spotify content.
 */
import SpotifyMark from "./SpotifyMark.vue";

withDefaults(
  defineProps<{
    /** Spotify URL of the content. */
    href: string;

    /** Button text. */
    label?: string;
  }>(),
  { label: "Ascolta su Spotify" },
);
</script>

<template>
  <a :href="href" class="btn-spotify" target="_blank" rel="noopener">
    <SpotifyMark />
    {{ label }}
  </a>
</template>
