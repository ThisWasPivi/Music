<script setup lang="ts">
/**
 * CoverImage component
 * Square cover art with a palette gradient while loading or when missing.
 */
withDefaults(
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
</script>

<template>
  <div
    class="cover"
    :style="{
      background: `linear-gradient(135deg, ${palette[0] ?? 'var(--c1)'}, ${palette[1] ?? 'var(--c2)'})`,
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
}
.cover img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
</style>
