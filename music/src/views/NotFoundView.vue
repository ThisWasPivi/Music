<script setup lang="ts">
/**
 * NotFoundView component
 * Shown for unknown routes, playlists and artists.
 */
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <section class="glass panel missing">
    <p class="eyebrow">404</p>
    <h1 class="page-title">{{ t("notFound.title") }}</h1>
    <p class="muted">{{ t("notFound.text") }}</p>
    <RouterLink :to="{ name: 'home' }" class="text-link">{{
      t("notFound.back")
    }}</RouterLink>
  </section>
</template>

<style scoped>
.missing {
  display: grid;
  gap: 12px;
  justify-items: start;
  max-inline-size: 640px;
}
.missing p {
  margin: 0;
}
</style>
