<script setup lang="ts">
/**
 * CoversView component
 * Every cover of the series in one tight mosaic, sorted along the rainbow
 * by its liveliest colour or alphabetically by name. Switching order
 * slides each cover to its new place. The order lives in the URL
 * (`?by=name`), so a link opens the same wall.
 */
import type { Playlist } from "@music/shared";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import AppIcon, { type IconName } from "@/components/ui/AppIcon.vue";
import CoverImage from "@/components/ui/CoverImage.vue";
import { useCatalog } from "@/composables/useCatalog.ts";
import { colorSortKey, colourfulOf, hexToHsl } from "@/utils/color.ts";
import { playlistTooltip } from "@/utils/tooltips.ts";

/** Orders the wall offers. */
type WallOrder = "color" | "name";

const ORDERS: readonly { id: WallOrder; label: string; icon: IconName }[] = [
  { id: "color", label: "covers.byColor", icon: "palette" },
  { id: "name", label: "covers.byName", icon: "text" },
];

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { playlists } = useCatalog();

const order = computed<WallOrder>(() =>
  route.query.by === "name" ? "name" : "color",
);

/**
 * Sort key along the rainbow: the cover's liveliest colour, greys last
 * from dark to light.
 * @param playlist - The playlist
 * @returns Hue key, then lightness as a tie-breaker
 */
function colourKey(playlist: Playlist): [number, number] {
  const hex =
    colourfulOf(playlist.palette)[0] ?? playlist.palette[0] ?? "#000000";
  return [colorSortKey(hex), hexToHsl(hex).lightness];
}

const wall = computed(() => {
  const list = [...playlists];
  if (order.value === "name")
    return list.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
  const keys = new Map(
    list.map((playlist) => [playlist.id, colourKey(playlist)]),
  );
  return list.sort((a, b) => {
    const [hueA, lightA] = keys.get(a.id) ?? [0, 0];
    const [hueB, lightB] = keys.get(b.id) ?? [0, 0];
    return hueA - hueB || lightA - lightB;
  });
});

/**
 * Switches the order, keeping it in the URL.
 * @param next - The new order
 * @returns Resolves after navigation
 */
async function setOrder(next: WallOrder): Promise<void> {
  await router.replace({ query: next === "color" ? {} : { by: next } });
}
</script>

<template>
  <div class="stack">
    <header class="head">
      <h1 class="page-title">{{ t("covers.title") }}</h1>
      <div class="chips" role="group" :aria-label="t('covers.orderBy')">
        <button
          v-for="option in ORDERS"
          :key="option.id"
          type="button"
          class="chip"
          :aria-pressed="order === option.id"
          @click="setOrder(option.id)"
        >
          <AppIcon :name="option.icon" />
          {{ t(option.label) }}
        </button>
      </div>
    </header>
    <p class="muted lede">
      {{ t("common.playlistCount", { n: wall.length }, wall.length) }}
    </p>

    <TransitionGroup tag="ol" name="wall" class="wall">
      <li
        v-for="(playlist, index) in wall"
        :key="playlist.id"
        :style="{ '--i': Math.min(index, 40) }"
      >
        <RouterLink
          v-tooltip="playlistTooltip(playlist)"
          :to="{ name: 'playlist', params: { id: playlist.id } }"
          :aria-label="playlist.name"
          class="wall__link"
        >
          <CoverImage :src="playlist.coverUrl" :palette="playlist.palette" />
        </RouterLink>
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 14px;
}
.lede {
  margin: -8px 0 0;
  font-size: 14px;
}
/* A tight mosaic: small gaps, covers lift out of it on hover. */
.wall {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
  grid-template-columns: repeat(auto-fill, minmax(min(110px, 22vw), 1fr));
}
.wall li {
  position: relative;
  animation: wall-in 560ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--i) * 18ms);
}
@keyframes wall-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
}
.wall__link {
  display: block;
  --cover-radius: 6px;
  border-radius: 6px;
  transition:
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 220ms ease;
}
.wall li:hover {
  z-index: 2;
}
.wall__link:hover,
.wall__link:focus-visible {
  transform: scale(1.18);
  box-shadow: 0 18px 40px -12px rgb(0 0 0 / 0.6);
}
/* Reordering: every cover glides to its new place. */
.wall-move {
  transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: calc(var(--i) * 6ms);
}
</style>
