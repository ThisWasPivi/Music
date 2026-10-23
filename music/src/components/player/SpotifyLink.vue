<script setup lang="ts">
/**
 * SpotifyLink component
 * "Listen on Spotify" button with the Spotify icon, as the brand
 * guidelines ask for links back to Spotify content.
 */
import { useI18n } from "vue-i18n";

import SpotifyMark from "./SpotifyMark.vue";

defineProps<{
  /** Spotify URL of the content. */
  href: string;

  /** Button text; defaults to "Listen on Spotify". */
  label?: string;
}>();

const { t } = useI18n();
</script>

<template>
  <a :href="href" class="btn-spotify" target="_blank" rel="noopener">
    <SpotifyMark />
    {{ label ?? t("common.listenOnSpotify") }}
  </a>
</template>
