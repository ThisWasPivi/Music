<script setup lang="ts">
/**
 * AppFooter component
 * Spotify attribution and the date of the last data sync.
 */
import SpotifyMark from "@/components/player/SpotifyMark.vue";
import { playlistRepository } from "@/repositories/PlaylistRepository.ts";
import { formatDate } from "@/utils/format.ts";

const meta = playlistRepository.meta();
</script>

<template>
  <footer class="footer">
    <p class="footer__spotify">
      <SpotifyMark class="footer__logo" />
      <span>
        Playlist, copertine e metadati da
        <a href="https://open.spotify.com" target="_blank" rel="noopener"
          >Spotify</a
        >. Ascolto tramite il player ufficiale Spotify.
      </span>
    </p>
    <p class="muted">
      Dati aggiornati al {{ formatDate(meta.generatedAt) }} ·
      <a href="https://pivi.dev" rel="noopener">pivi.dev</a>
    </p>
  </footer>
</template>

<style scoped>
.footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 24px;
  max-inline-size: 1200px;
  margin: 48px auto 0;
  box-sizing: content-box;
  padding: 24px var(--gutter) calc(32px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--line);
  font-size: 13px;
}
.footer p {
  margin: 0;
}
.footer__spotify {
  display: flex;
  gap: 10px;
  align-items: center;
  max-inline-size: 60ch;
}
.footer__logo {
  flex: none;
  font-size: 22px;
  color: var(--spotify);
}
:root[data-theme="light"] .footer__logo {
  color: #000;
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) .footer__logo {
    color: #000;
  }
}
</style>
