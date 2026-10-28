<script setup lang="ts">
/**
 * CoverImage component
 * Square cover art. While the image loads, a shimmering skeleton tinted
 * with the cover's colours holds its place; the image then fades and
 * sharpens in. Missing covers keep a palette gradient.
 *
 * Once loaded, the placeholder colour is dropped and the image is zoomed by
 * 2%: otherwise the rounded clip lets a hairline of the (often dark)
 * placeholder show around the edge, and many Spotify covers carry a 1px
 * dark border from being resized.
 */
import { ref, watch } from "vue";

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
  }>(),
  { alt: "", palette: () => [], eager: false },
);

const loaded = ref(false);
watch(
  () => props.src,
  () => (loaded.value = false),
);
</script>

<template>
  <div
    class="cover"
    :class="{ 'cover--loading': src && !loaded, 'cover--loaded': loaded }"
    :style="{
      '--from': palette[0] ?? 'var(--c1)',
      '--to': palette[1] ?? 'var(--c2)',
    }"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      width="640"
      height="640"
      :class="{ 'cover__img--in': loaded }"
      @load="loaded = true"
      @error="loaded = true"
    />
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
.cover--loaded {
  background: transparent;
}
.cover img.cover__img--in {
  opacity: 1;
  filter: none;
  transform: scale(1.02);
}
</style>
