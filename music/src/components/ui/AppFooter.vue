<script setup lang="ts">
/**
 * AppFooter component
 * Spotify attribution, data date, app version and links to the curator's
 * page and to the source code, all from site.config.ts.
 */
import { site } from "@site";
import { useI18n } from "vue-i18n";

import SpotifyMark from "@/components/player/SpotifyMark.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { playlistRepository } from "@/repositories/PlaylistRepository.ts";
import { formatDate } from "@/utils/format.ts";

const { t } = useI18n();
const meta = playlistRepository.meta();
const VERSION = __APP_VERSION__;
const COMMIT = __APP_COMMIT__;
const REPOSITORY = site.repository;
</script>

<template>
  <footer class="footer">
    <div class="footer__spotify">
      <SpotifyMark class="footer__logo" />
      <i18n-t keypath="footer.spotify" tag="p" scope="global">
        <template #spotify>
          <a href="https://open.spotify.com" target="_blank" rel="noopener"
            >Spotify</a
          >
        </template>
      </i18n-t>
    </div>
    <nav
      v-if="site.owner || REPOSITORY"
      class="footer__links"
      :aria-label="t('footer.links')"
    >
      <a
        v-if="site.owner"
        :href="site.owner.url"
        target="_blank"
        rel="noopener"
        class="footer__link"
      >
        <AppIcon name="heart" class="footer__icon footer__icon--heart" />
        {{ t("footer.madeBy", { owner: site.owner.name }) }}
      </a>
      <a
        v-if="REPOSITORY"
        :href="REPOSITORY"
        target="_blank"
        rel="noopener"
        class="footer__link"
      >
        <AppIcon name="code" class="footer__icon" />
        {{ t("footer.source") }}
      </a>
    </nav>
    <p class="footer__meta muted tabular">
      {{ t("footer.updated", { date: formatDate(meta.generatedAt) }) }}
      <template v-if="!REPOSITORY"> · v{{ VERSION }}</template>
      <template v-else> · </template>
      <a
        v-if="REPOSITORY"
        v-tooltip="t('footer.changelog')"
        :href="`${REPOSITORY}/blob/main/CHANGELOG.md`"
        target="_blank"
        rel="noopener"
      >
        v{{ VERSION }}</a
      ><template v-if="COMMIT && REPOSITORY">
        ·
        <a
          v-tooltip="t('footer.commit')"
          :href="`${REPOSITORY}/commit/${COMMIT}`"
          target="_blank"
          rel="noopener"
          >{{ COMMIT.slice(0, 7) }}</a
        ></template
      >
    </p>
  </footer>
</template>

<style scoped>
.footer {
  display: grid;
  gap: 12px 24px;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  max-inline-size: 1200px;
  margin: 56px auto 0;
  padding: 24px var(--gutter) 0;
  /* On phones, room for the floating tab bar. */
  --tabs-room: 0px;
  padding-block-end: calc(
    32px + var(--tabs-room) + env(safe-area-inset-bottom, 0px)
  );
  border-top: 1px solid var(--line);
  font-size: 13px;
  box-sizing: content-box;
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
.footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.footer__link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  font-weight: 600;
  text-decoration: none;
}
.footer__link:hover {
  background: var(--glass-strong);
}
.footer__icon {
  color: var(--accent);
}
.footer__icon--heart {
  color: #f472b6;
}
.footer__meta {
  grid-column: 1 / -1;
}
.footer__meta a {
  text-decoration: none;
  border-radius: 5px;
  transition:
    color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease;
}
.footer__meta a:hover {
  color: var(--accent);
  background: color-mix(in oklab, var(--accent) 16%, transparent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 16%, transparent);
}
@media (max-width: 640px) {
  .footer {
    grid-template-columns: minmax(0, 1fr);
    --tabs-room: 76px;
  }
  .footer__links {
    justify-content: flex-start;
  }
}
</style>
