<script setup lang="ts">
/**
 * AuroraBackdrop component
 * Fixed, blurred colour blobs behind the whole app, painted with the
 * current accents. Purely decorative.
 */
</script>

<template>
  <div class="aurora" aria-hidden="true">
    <span />
    <span />
    <span />
  </div>
</template>

<style scoped>
.aurora {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.aurora span {
  position: absolute;
  inline-size: 60vmax;
  aspect-ratio: 1;
  border-radius: 50%;
  filter: blur(100px);
  opacity: var(--blob-opacity);
  transition: background-color 800ms ease;
}
.aurora span:nth-child(1) {
  background: var(--c1);
  inset: -25vmax auto auto -15vmax;
}
.aurora span:nth-child(2) {
  background: var(--c2);
  inset: 20vh -25vmax auto auto;
}
.aurora span:nth-child(3) {
  background: var(--c3);
  inset: auto auto -30vmax 10vw;
  opacity: calc(var(--blob-opacity) * 0.7);
}
</style>
