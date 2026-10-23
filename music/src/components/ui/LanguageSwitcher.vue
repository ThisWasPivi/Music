<script setup lang="ts">
/**
 * LanguageSwitcher component
 * Round-flag menu to switch the site language.
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { type LocaleCode, LOCALES, setLocale } from "@/i18n/index.ts";

import SelectMenu, { type SelectOption } from "./SelectMenu.vue";

const { t, locale } = useI18n();
const options = computed<SelectOption<LocaleCode>[]>(() =>
  LOCALES.map((option) => ({
    value: option.code,
    label: option.label,
    image: option.flag,
    round: true,
  })),
);
const value = computed({
  get: () => locale.value as LocaleCode,
  set: (code: LocaleCode | null) => code && setLocale(code),
});
</script>

<template>
  <SelectMenu
    v-model="value"
    :options="options"
    :label="t('language.label')"
    :searchable="false"
    compact
    align-end
  />
</template>
