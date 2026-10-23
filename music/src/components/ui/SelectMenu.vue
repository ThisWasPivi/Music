<script setup lang="ts" generic="T extends string | number">
/**
 * SelectMenu component
 * Themed replacement for `<select>`: a glass pop-over listbox with an
 * optional fuzzy search field, images per option and full keyboard support
 * (arrows, Home/End, Enter, Escape, type to search).
 */
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import { useI18n } from "vue-i18n";

import { fuzzyRank } from "@/utils/fuzzy.ts";

/**
 * One choice.
 * @property value - Value emitted when picked; null clears the selection
 * @property label - Text shown
 * @property hint - Optional secondary text, e.g. a count
 * @property image - Optional image URL shown before the label
 * @property round - Draws the image as a circle (artists, flags)
 */
export interface SelectOption<V> {
  value: V | null;
  label: string;
  hint?: string;
  image?: string | null;
  round?: boolean;
}

const props = withDefaults(
  defineProps<{
    /** Current value; null when nothing is selected. */
    modelValue: T | null;

    /** Choices, in display order. */
    options: readonly SelectOption<T>[];

    /** Accessible name of the control. */
    label: string;

    /** Shows a search field; defaults to on for more than 7 options. */
    searchable?: boolean;

    /** Only the selected image is shown in the trigger (e.g. a flag). */
    compact?: boolean;

    /** Opens the menu aligned to the right edge of the trigger. */
    alignEnd?: boolean;
  }>(),
  { searchable: undefined, compact: false, alignEnd: false },
);

const emit = defineEmits<{
  /** A new value was picked. */
  "update:modelValue": [value: T | null];
}>();

const { t } = useI18n();
const id = useId();
const open = ref(false);
const query = ref("");
const active = ref(0);
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const search = ref<HTMLInputElement | null>(null);
const list = ref<HTMLElement | null>(null);

const withSearch = computed(() => props.searchable ?? props.options.length > 7);
const selected = computed(
  () =>
    props.options.find((option) => option.value === props.modelValue) ??
    props.options[0],
);
const visible = computed(() =>
  fuzzyRank(props.options, query.value, (option) => [
    option.label,
    option.hint ?? "",
  ]),
);

/**
 * Closes the menu when a click lands outside it.
 * @param event - The pointer event
 * @returns Nothing
 */
function onOutside(event: PointerEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) close(false);
}

/**
 * Opens the menu with the current value highlighted.
 * @returns Resolves once the menu has focus
 */
async function openMenu(): Promise<void> {
  open.value = true;
  query.value = "";
  active.value = Math.max(
    0,
    visible.value.indexOf(selected.value as SelectOption<T>),
  );
  document.addEventListener("pointerdown", onOutside);
  await nextTick();
  (withSearch.value ? search.value : list.value)?.focus();
  scrollActive();
}

/**
 * Closes the menu.
 * @param refocus - Moves focus back to the trigger
 * @returns Nothing
 */
function close(refocus = true): void {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener("pointerdown", onOutside);
  if (refocus) trigger.value?.focus();
}

/**
 * Picks an option and closes.
 * @param option - The chosen option
 * @returns Nothing
 */
function pick(option: SelectOption<T> | undefined): void {
  if (!option) return;
  emit("update:modelValue", option.value);
  close();
}

/**
 * Keeps the highlighted option in view.
 * @returns Nothing
 */
function scrollActive(): void {
  list.value
    ?.querySelector<HTMLElement>(`[data-index="${active.value}"]`)
    ?.scrollIntoView({ block: "nearest" });
}

/**
 * Keyboard navigation inside the open menu.
 * @param event - The key event
 * @returns Nothing
 */
function onKey(event: KeyboardEvent): void {
  const last = visible.value.length - 1;
  const moves: Record<string, number> = {
    ArrowDown: Math.min(last, active.value + 1),
    ArrowUp: Math.max(0, active.value - 1),
    Home: 0,
    End: last,
  };
  if (event.key in moves) {
    event.preventDefault();
    active.value = moves[event.key] ?? 0;
    void nextTick(scrollActive);
  } else if (event.key === "Enter") {
    event.preventDefault();
    pick(visible.value[active.value]);
  } else if (event.key === "Escape") {
    event.preventDefault();
    close();
  } else if (event.key === "Tab") {
    close(false);
  }
}

watch(query, () => (active.value = 0));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="select">
    <button
      ref="trigger"
      type="button"
      class="select__trigger"
      :class="{ 'select__trigger--compact': compact }"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="`${id}-list`"
      :aria-label="`${label}: ${selected?.label ?? ''}`"
      @click="open ? close() : openMenu()"
      @keydown.down.prevent="openMenu()"
    >
      <img
        v-if="selected?.image"
        :src="selected.image"
        alt=""
        class="select__image"
        :class="{ 'select__image--round': selected.round }"
      />
      <span v-if="!compact" class="select__value">{{ selected?.label }}</span>
      <svg class="select__chevron" viewBox="0 0 12 12" aria-hidden="true">
        <path
          d="M3 4.5 6 7.5 9 4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
    </button>

    <Transition name="pop">
      <div
        v-if="open"
        class="select__panel"
        :class="{ 'select__panel--end': alignEnd }"
        @keydown="onKey"
      >
        <div v-if="withSearch" class="select__search">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle
              cx="7"
              cy="7"
              r="4.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            />
            <path
              d="m10.5 10.5 3 3"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
          <input
            :id="`${id}-search`"
            ref="search"
            v-model="query"
            type="search"
            role="combobox"
            autocomplete="off"
            :placeholder="t('select.search')"
            :aria-label="t('select.searchIn', { label })"
            :aria-controls="`${id}-list`"
            aria-expanded="true"
            :aria-activedescendant="
              visible.length > 0 ? `${id}-option-${active}` : undefined
            "
          />
        </div>
        <ul
          :id="`${id}-list`"
          ref="list"
          role="listbox"
          :aria-label="label"
          :tabindex="withSearch ? -1 : 0"
          :aria-activedescendant="
            !withSearch && visible.length > 0
              ? `${id}-option-${active}`
              : undefined
          "
          class="select__list"
        >
          <li
            v-for="(option, index) in visible"
            :id="`${id}-option-${index}`"
            :key="String(option.value)"
            role="option"
            :data-index="index"
            :aria-selected="option.value === modelValue"
            class="select__option"
            :class="{ 'select__option--active': index === active }"
            @pointerenter="active = index"
            @click="pick(option)"
          >
            <img
              v-if="option.image"
              :src="option.image"
              alt=""
              loading="lazy"
              class="select__image"
              :class="{ 'select__image--round': option.round }"
            />
            <span class="select__label">{{ option.label }}</span>
            <span v-if="option.hint" class="select__hint">{{
              option.hint
            }}</span>
            <svg
              v-if="option.value === modelValue"
              class="select__check"
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <path
                d="m2.5 6.5 2.5 2.5 4.5-5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </li>
          <li
            v-if="visible.length === 0"
            class="select__empty"
            role="presentation"
          >
            {{ t("select.noResults") }}
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.select {
  position: relative;
  display: inline-block;
  max-inline-size: 100%;
}
.select__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-inline-size: 100%;
  min-block-size: 38px;
  padding: 5px 12px 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  color: var(--text);
  font: 500 13px/1.2 var(--font-body);
  cursor: pointer;
  transition:
    background 150ms ease,
    border-color 150ms ease;
}
.select__trigger:hover,
.select__trigger[aria-expanded="true"] {
  background: var(--glass-strong);
  border-color: color-mix(in oklab, var(--accent) 45%, var(--glass-border));
}
.select__trigger--compact {
  padding: 4px 8px 4px 5px;
  min-block-size: 40px;
}
.select__trigger--compact .select__image {
  inline-size: 28px;
  block-size: 28px;
}
.select__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.select__chevron {
  flex: none;
  inline-size: 12px;
  block-size: 12px;
  color: var(--muted);
  transition: transform 200ms ease;
}
[aria-expanded="true"] > .select__chevron {
  transform: rotate(180deg);
}
.select__panel {
  position: absolute;
  inset: calc(100% + 8px) auto auto 0;
  z-index: 50;
  inline-size: min(320px, calc(100vw - 32px));
  padding: 8px;
  border-radius: 18px;
  border: 1px solid var(--glass-border);
  background: var(--glass-strong);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  box-shadow: var(--shadow);
  transform-origin: top left;
}
.select__panel--end {
  inset: calc(100% + 8px) 0 auto auto;
  transform-origin: top right;
}
.select__search {
  position: relative;
  margin-bottom: 6px;
}
.select__search svg {
  position: absolute;
  inset: 50% auto auto 12px;
  inline-size: 15px;
  block-size: 15px;
  transform: translateY(-50%);
  color: var(--muted);
}
.select__search input {
  inline-size: 100%;
  min-block-size: 38px;
  padding: 8px 12px 8px 34px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--glass);
  color: var(--text);
  font: inherit;
  font-size: 14px;
}
.select__search input:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 0;
}
.select__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-block-size: min(320px, 50vh);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.select__list:focus-visible {
  outline: none;
}
.select__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}
.select__option--active {
  background: color-mix(in oklab, var(--accent) 16%, transparent);
}
.select__option[aria-selected="true"] {
  font-weight: 650;
}
.select__image {
  flex: none;
  inline-size: 26px;
  block-size: 26px;
  border-radius: 6px;
  object-fit: cover;
}
.select__image--round {
  border-radius: 50%;
}
.select__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.select__hint {
  color: var(--muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.select__check {
  flex: none;
  inline-size: 14px;
  block-size: 14px;
  color: var(--accent);
}
.select__empty {
  padding: 12px;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
}
.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 160ms ease,
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}
</style>
