<script setup lang="ts">
/**
 * CoverImage component
 * Square cover art. While the image loads, a shimmering skeleton tinted
 * with the cover's colours holds its place; the image then fades and
 * sharpens in. Missing covers keep a palette gradient, with the initial of
 * `name` on it when given (artists without a picture).
 *
 * Once loaded, the placeholder colour is dropped and the image is zoomed by
 * 2%: otherwise the rounded clip lets a hairline of the (often dark)
 * placeholder show around the edge, and many Spotify covers carry a 1px
 * dark border from being resized.
 */
import { computed, ref, watch } from "vue";

import { auroraTint } from "@/utils/color.ts";

const props = withDefaults(
  defineProps<{
    /** Image URL, or null when Spotify has none. */
    src: string | null;

    /** Alternative text; empty for decorative covers next to a visible title. */
    alt?: string;

    /** Colours for the placeholder gradient. */
    palette?: readonly string[];

    /** Loads immediately instead of lazily. */
    eager?: boolean;

    /** Name whose initial stands in for a missing picture. */
    name?: string;
  }>(),
  { alt: "", palette: () => [], eager: false, name: "" },
);

const loaded = ref(false);
/*
 * Placeholder colours: the cover's own palette, or, for a named picture
 * without one, two aurora tints picked from the name so every artist gets
 * a colour of their own.
 */
const colours = computed(() => {
  if (props.palette.length > 0)
    return [props.palette[0], props.palette[1] ?? props.palette[0]];
  if (!props.name) return ["var(--c1)", "var(--c2)"];
  let hash = 0;
  for (const char of props.name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const position = (hash % 1000) / 1000;
  return [auroraTint(position), auroraTint((position + 0.3) % 1)];
});

/* The initial of the name, skipping a leading article ("The Cure" → C). */
const initial = computed(() =>
  props.name
    .trim()
    .replace(/^(the|il|lo|la|i|gli|le|l'|a|an)\s+/i, "")
    .charAt(0)
    .toUpperCase(),
);

/* The image failed to load: the placeholder and initial stay instead. */
const failed = ref(false);
watch(
  () => props.src,
  () => {
    loaded.value = false;
    failed.value = false;
  },
);
</script>

<template>
  <div
    class="cover"
    :class="{
      'cover--loading': src && !loaded && !failed,
      'cover--loaded': loaded && !failed,
    }"
    :style="{
      '--from': colours[0],
      '--to': colours[1],
    }"
  >
    <img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      width="640"
      height="640"
      :class="{ 'cover__img--in': loaded }"
      @load="loaded = true"
      @error="failed = true"
    />
    <span v-else-if="name" class="cover__initial" aria-hidden="true">{{
      initial
    }}</span>
  </div>
</template>

<style scoped>
.cover {
  position: relative;
  aspect-ratio: 1;
  max-inline-size: 100%;
  overflow: hidden;
  border-radius: var(--cover-radius, 14px);
  /* Clips the zoomed image on its own layer, without a fringe at the corners. */
  isolation: isolate;
  container-type: inline-size;
  transition:
    transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 260ms ease;
  background: linear-gradient(135deg, var(--from), var(--to));
}
/* The skeleton: the cover's gradient with a sheen sweeping across. */
.cover--loading::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgb(255 255 255 / 0.28) 50%,
    transparent 70%
  );
  background-size: 250% 100%;
  animation: cover-sheen 1.3s ease-in-out infinite;
}
@keyframes cover-sheen {
  from {
    background-position: 130% 0;
  }
  to {
    background-position: -130% 0;
  }
}
.cover img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  opacity: 0;
  filter: blur(12px);
  transform: scale(1.06);
  transition:
    opacity 500ms ease,
    filter 600ms ease,
    transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
}
/* Sized from the cover's own width, so it fits a 32px avatar and a hero alike. */
.cover__initial {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font: 750 45cqi / 1 var(--font-display);
  text-shadow: 0 1px 6px rgb(0 0 0 / 0.3);
}
.cover--loaded {
  background: transparent;
}
.cover img.cover__img--in {
  opacity: 1;
  filter: none;
  transform: scale(1.02);
}
</style>
