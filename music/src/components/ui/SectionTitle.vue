<script setup lang="ts">
/**
 * SectionTitle component
 * A panel heading with an optional info button: hovering, focusing or
 * tapping it shows what the chart or list below means, so the panel needs
 * no paragraph of explanation.
 */
import { useI18n } from "vue-i18n";

import AppIcon from "./AppIcon.vue";

defineProps<{
  /** Heading id, referenced by the section's aria-labelledby. */
  id: string;

  /** Heading text. */
  title: string;

  /** Explanation shown in the info tooltip. */
  info?: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="title">
    <h2 :id="id" class="section-title title__text">{{ title }}</h2>
    <button
      v-if="info"
      v-tooltip="info"
      type="button"
      class="title__info"
      :aria-label="t('common.aboutChart', { title })"
    >
      <AppIcon name="info" />
    </button>
  </div>
</template>

<style scoped>
.title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-block-end: 14px;
}
.title__text {
  margin: 0;
}
.title__info {
  display: grid;
  place-items: center;
  inline-size: 30px;
  block-size: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  font-size: 15px;
  transition:
    color 160ms ease,
    background 160ms ease,
    transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.title__info:hover,
.title__info:focus-visible {
  color: var(--accent);
  background: color-mix(in oklab, var(--accent) 16%, transparent);
  transform: scale(1.08);
}
</style>
