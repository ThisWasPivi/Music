<script setup lang="ts">
/**
 * SampleDataNotice component
 * Says plainly when the site shows the invented sample data instead of the
 * real playlists.
 */
import { playlistRepository } from "@/repositories/PlaylistRepository.ts";

const isSample = playlistRepository.meta().source === "fixtures";
</script>

<template>
  <i18n-t
    v-if="isSample"
    keypath="app.sampleNotice"
    tag="p"
    scope="global"
    class="notice"
    role="note"
  >
    <template #sample>
      <strong>{{ $t("app.sampleData") }}</strong>
    </template>
    <template #command>
      <code>pnpm release</code>
    </template>
  </i18n-t>
</template>

<style scoped>
.notice {
  max-inline-size: 1200px;
  margin: 12px auto 0;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--glass-border);
  background: var(--glass);
  font-size: 13px;
  text-align: center;
}
.notice code {
  font-size: 12px;
}
</style>
