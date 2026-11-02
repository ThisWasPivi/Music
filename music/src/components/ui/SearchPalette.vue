<script setup lang="ts">
/**
 * SearchPalette component
 * One search box over everything: playlists, artists, albums and tracks,
 * fuzzy-matched and grouped. Opens with ⌘K / Ctrl+K, "/" or the header
 * button; arrows move, Enter opens, Escape closes. With nothing typed it
 * offers shortcuts: a random playlist, the year in review and the cover
 * wall.
 */
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { type RouteLocationRaw, useRouter } from "vue-router";

import { useCatalog } from "@/composables/useCatalog.ts";
import { usePalette } from "@/composables/usePalette.ts";
import { useSurprise } from "@/composables/useSurprise.ts";
import {
  buildSearchIndex,
  type SearchEntry,
  searchIndex,
  type SearchKind,
} from "@/services/search.ts";

import AppIcon, { type IconName } from "./AppIcon.vue";

const { t } = useI18n();
const router = useRouter();
const catalog = useCatalog();
const { isOpen, show, hide } = usePalette();
const surprise = useSurprise();

/* Built on first open: the catalogue never changes while the page is open. */
let searchable: SearchEntry[] | undefined;
const query = ref("");
const active = ref(0);
const input = ref<HTMLInputElement | null>(null);

/**
 * One selectable row: a search result or a shortcut.
 * @property key - Unique key
 * @property title - Main line
 * @property subtitle - Secondary line
 * @property image - Picture, if any
 * @property icon - Icon shown when there is no picture
 * @property round - Draws the picture as a circle (artists)
 * @property run - What Enter or a click does
 */
interface Row {
  key: string;
  title: string;
  subtitle: string;
  image: string | null;
  icon: IconName;
  round: boolean;
  run: () => Promise<unknown>;
}

const KIND_ICONS: Record<SearchKind, IconName> = {
  playlist: "grid",
  artist: "user",
  album: "album",
  track: "tracks",
};

/**
 * Opens a route and closes the palette.
 * @param to - Where to go
 * @returns Resolves after navigation
 */
async function go(to: RouteLocationRaw): Promise<void> {
  hide();
  await router.push(to);
}

/**
 * Turns a search result into a row.
 * @param entry - The result
 * @returns The row
 */
function rowOf(entry: SearchEntry): Row {
  const where =
    entry.playlistId && entry.kind !== "playlist"
      ? catalog.byId(entry.playlistId)?.name
      : undefined;
  return {
    key: `${entry.kind}:${entry.id}`,
    title: entry.title,
    subtitle: [entry.subtitle, where && t("search.inPlaylist", { name: where })]
      .filter(Boolean)
      .join(" · "),
    image: entry.image,
    icon: KIND_ICONS[entry.kind],
    round: entry.kind === "artist",
    run: () =>
      entry.playlistId
        ? go({ name: "playlist", params: { id: entry.playlistId } })
        : go({ name: "artist", params: { id: entry.id } }),
  };
}

const shortcuts = computed<Row[]>(() => [
  {
    key: "surprise",
    title: t("surprise.label"),
    subtitle: t("surprise.hint"),
    image: null,
    icon: "shuffle",
    round: false,
    run: async () => {
      hide();
      await surprise();
    },
  },
  {
    key: "years",
    title: t("nav.years"),
    subtitle: t("search.yearsHint"),
    image: null,
    icon: "sparkle",
    round: false,
    run: () => go({ name: "years" }),
  },
  {
    key: "covers",
    title: t("covers.title"),
    subtitle: t("search.coversHint"),
    image: null,
    icon: "wall",
    round: false,
    run: () => go({ name: "covers" }),
  },
]);

const groups = computed(() => {
  if (!isOpen.value) return [];
  searchable ??= buildSearchIndex(
    catalog.playlists,
    catalog.artists,
    catalog.profile,
  );
  return searchIndex(searchable, query.value).map((group) => ({
    kind: group.kind,
    rows: group.entries.map(rowOf),
  }));
});

/** Every row in display order, for the arrow keys. */
const rows = computed<Row[]>(() =>
  query.value.trim() === ""
    ? shortcuts.value
    : groups.value.flatMap((group) => group.rows),
);

watch(query, () => (active.value = 0));
watch(isOpen, async (open) => {
  if (!open) return;
  query.value = "";
  active.value = 0;
  await nextTick();
  input.value?.focus();
});

/**
 * Moves the highlight and keeps it in view.
 * @param step - +1 down, -1 up
 * @returns Nothing
 */
function move(step: number): void {
  const count = rows.value.length;
  if (count === 0) return;
  active.value = (active.value + step + count) % count;
  void nextTick(() =>
    document
      .getElementById(`palette-${active.value}`)
      ?.scrollIntoView({ block: "nearest" }),
  );
}

/**
 * Keyboard handling inside the palette.
 * @param event - The key press
 * @returns Nothing
 */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    move(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    move(-1);
  } else if (event.key === "Enter") {
    event.preventDefault();
    void rows.value[active.value]?.run();
  } else if (event.key === "Escape") {
    event.preventDefault();
    hide();
  }
}

/**
 * Global shortcuts: ⌘K / Ctrl+K anywhere, "/" outside text fields.
 * @param event - The key press
 * @returns Nothing
 */
function onGlobalKeydown(event: KeyboardEvent): void {
  const typing =
    event.target instanceof HTMLElement &&
    (event.target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (isOpen.value) hide();
    else show();
  } else if (event.key === "/" && !typing && !isOpen.value) {
    event.preventDefault();
    show();
  }
}

onMounted(() => window.addEventListener("keydown", onGlobalKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onGlobalKeydown));

/** Running index of a row inside its group, for ids and highlighting. */
const offsets = computed(() => {
  let total = 0;
  return groups.value.map((group) => {
    const start = total;
    total += group.rows.length;
    return start;
  });
});
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="isOpen" class="palette" @mousedown.self="hide()">
        <div
          class="palette__panel glass-pop"
          role="dialog"
          aria-modal="true"
          :aria-label="t('search.title')"
        >
          <label class="palette__field">
            <AppIcon name="search" class="palette__glass" />
            <span class="sr-only">{{ t("search.title") }}</span>
            <input
              ref="input"
              v-model="query"
              type="search"
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-list"
              :aria-activedescendant="
                rows.length > 0 ? `palette-${active}` : undefined
              "
              autocomplete="off"
              spellcheck="false"
              :placeholder="t('search.placeholder')"
              @keydown="onKeydown"
            />
            <kbd class="palette__key">Esc</kbd>
          </label>

          <div id="palette-list" class="palette__list" role="listbox">
            <template v-if="query.trim() === ''">
              <p class="palette__heading">{{ t("search.shortcuts") }}</p>
              <button
                v-for="(row, index) in shortcuts"
                :id="`palette-${index}`"
                :key="row.key"
                type="button"
                role="option"
                class="palette__row"
                :aria-selected="index === active"
                @mousemove="active = index"
                @click="row.run()"
              >
                <span class="palette__icon"><AppIcon :name="row.icon" /></span>
                <span class="palette__text">
                  <strong>{{ row.title }}</strong>
                  <span class="muted">{{ row.subtitle }}</span>
                </span>
              </button>
            </template>

            <template v-else>
              <section
                v-for="(group, groupIndex) in groups"
                :key="group.kind"
                role="group"
                :aria-label="t(`search.kinds.${group.kind}`)"
              >
                <p class="palette__heading">
                  {{ t(`search.kinds.${group.kind}`) }}
                </p>
                <button
                  v-for="(row, rowIndex) in group.rows"
                  :id="`palette-${(offsets[groupIndex] ?? 0) + rowIndex}`"
                  :key="row.key"
                  type="button"
                  role="option"
                  class="palette__row"
                  :aria-selected="
                    (offsets[groupIndex] ?? 0) + rowIndex === active
                  "
                  @mousemove="active = (offsets[groupIndex] ?? 0) + rowIndex"
                  @click="row.run()"
                >
                  <img
                    v-if="row.image"
                    :src="row.image"
                    alt=""
                    class="palette__image"
                    :class="{ 'palette__image--round': row.round }"
                    loading="lazy"
                    width="40"
                    height="40"
                  />
                  <span v-else class="palette__icon">
                    <AppIcon :name="row.icon" />
                  </span>
                  <span class="palette__text">
                    <strong>{{ row.title }}</strong>
                    <span v-if="row.subtitle" class="muted">{{
                      row.subtitle
                    }}</span>
                  </span>
                  <AppIcon :name="row.icon" class="palette__kind" />
                </button>
              </section>
              <p v-if="groups.length === 0" class="palette__empty muted">
                {{ t("search.empty", { query }) }}
              </p>
            </template>
          </div>

          <p class="palette__foot muted">
            <span><kbd>↑</kbd> <kbd>↓</kbd> {{ t("search.move") }}</span>
            <span><kbd>↵</kbd> {{ t("search.open") }}</span>
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.palette {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  justify-items: center;
  align-items: start;
  padding: max(10vh, 16px) 16px 16px;
  background: color-mix(in oklab, var(--bg) 45%, transparent);
  backdrop-filter: blur(6px);
}
.palette__panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  inline-size: min(640px, 100%);
  max-block-size: min(560px, 80vh);
  border-radius: 22px;
  overflow: hidden;
}
.palette__field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}
.palette__glass {
  font-size: 18px;
  color: var(--muted);
}
.palette__field input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: 500 17px var(--font-body);
  outline: none;
}
.palette__field input::-webkit-search-cancel-button {
  display: none;
}
kbd {
  display: inline-block;
  min-inline-size: 1.6em;
  padding: 1px 6px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--glass);
  font: 600 11px/1.5 var(--font-body);
  text-align: center;
}
.palette__list {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 6px 8px 10px;
}
.palette__heading {
  margin: 10px 8px 4px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.palette__row {
  display: flex;
  align-items: center;
  gap: 12px;
  inline-size: 100%;
  padding: 8px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: start;
}
.palette__row[aria-selected="true"] {
  background: color-mix(in oklab, var(--accent) 16%, transparent);
}
.palette__image,
.palette__icon {
  flex: none;
  inline-size: 40px;
  block-size: 40px;
  border-radius: 8px;
}
.palette__image {
  object-fit: cover;
}
.palette__image--round {
  border-radius: 50%;
}
.palette__icon {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--c1), var(--c2));
  color: #fff;
  font-size: 18px;
}
.palette__text {
  display: grid;
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 1.35;
}
.palette__text > * {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.palette__text strong {
  font-size: 15px;
}
.palette__kind {
  color: var(--muted);
  opacity: 0;
}
.palette__row[aria-selected="true"] .palette__kind {
  opacity: 1;
}
.palette__empty {
  margin: 20px 8px;
  text-align: center;
}
.palette__foot {
  display: flex;
  gap: 16px;
  margin: 0;
  padding: 10px 16px;
  border-top: 1px solid var(--line);
  font-size: 12px;
}
@media (hover: none) {
  .palette__foot,
  .palette__key {
    display: none;
  }
}
.palette-enter-active,
.palette-leave-active {
  transition: opacity 180ms ease;
}
.palette-enter-active .palette__panel,
.palette-leave-active .palette__panel {
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}
.palette-enter-from .palette__panel,
.palette-leave-to .palette__panel {
  transform: translateY(-10px) scale(0.98);
}
</style>
