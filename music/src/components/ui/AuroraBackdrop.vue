<script setup lang="ts">
/**
 * AuroraBackdrop component
 * Fixed, heavily blurred orbs behind the whole app, painted with the
 * current cover accents and drifting slowly, plus a soft gradient veil.
 * Purely decorative; still when motion is reduced.
 */
</script>

<template>
  <div class="aurora" aria-hidden="true">
    <span class="aurora__orb aurora__orb--1" />
    <span class="aurora__orb aurora__orb--2" />
    <span class="aurora__orb aurora__orb--3" />
    <span class="aurora__orb aurora__orb--4" />
    <span class="aurora__veil" />
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
.aurora__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: var(--blob-opacity);
  transition: background-color 1.2s ease;
  will-change: transform;
}
.aurora__orb--1 {
  inline-size: min(70vw, 760px);
  aspect-ratio: 1;
  inset: -18vh auto auto -12vw;
  background: radial-gradient(circle at 40% 40%, var(--c1), transparent 70%);
  animation: drift-a 26s ease-in-out infinite alternate;
}
.aurora__orb--2 {
  inline-size: min(60vw, 680px);
  aspect-ratio: 1;
  inset: 18vh -14vw auto auto;
  background: radial-gradient(circle at 50% 50%, var(--c2), transparent 70%);
  animation: drift-b 32s ease-in-out infinite alternate;
}
.aurora__orb--3 {
  inline-size: min(65vw, 720px);
  aspect-ratio: 1;
  inset: auto auto -28vh 18vw;
  background: radial-gradient(circle at 50% 50%, var(--c3), transparent 70%);
  animation: drift-c 38s ease-in-out infinite alternate;
}
.aurora__orb--4 {
  inline-size: min(40vw, 440px);
  aspect-ratio: 1;
  inset: 38vh auto auto 30vw;
  background: radial-gradient(circle at 50% 50%, var(--c1), transparent 70%);
  opacity: calc(var(--blob-opacity) * 0.6);
  animation: drift-d 44s ease-in-out infinite alternate;
}
.aurora__veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      120% 80% at 0% 0%,
      color-mix(in oklab, var(--c1) 22%, transparent),
      transparent 60%
    ),
    radial-gradient(
      120% 80% at 100% 100%,
      color-mix(in oklab, var(--c2) 18%, transparent),
      transparent 60%
    );
}
@keyframes drift-a {
  to {
    transform: translate(12vw, 10vh) scale(1.15);
  }
}
@keyframes drift-b {
  to {
    transform: translate(-14vw, 8vh) scale(0.9);
  }
}
@keyframes drift-c {
  to {
    transform: translate(10vw, -12vh) scale(1.1);
  }
}
@keyframes drift-d {
  to {
    transform: translate(-18vw, -10vh) scale(1.25);
  }
}
@media (prefers-reduced-motion: reduce) {
  .aurora__orb {
    animation: none;
  }
}
</style>
