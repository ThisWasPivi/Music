<script setup lang="ts">
/**
 * NotFoundView component
 * Shown for unknown routes, playlists and artists.
 */
</script>

<template>
  <section class="glass panel missing">
    <p class="eyebrow">404</p>
    <h1 class="page-title">Questo disco non c'è</h1>
    <p class="muted">
      La pagina che cerchi non esiste, o la playlist non fa parte della serie.
    </p>
    <RouterLink :to="{ name: 'home' }" class="text-link"
      >Torna a tutti i numeri</RouterLink
    >
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
