<script setup lang="ts">
/**
 * BrandMark component
 * The site logo: a "p" drawn as a record player, the bowl a vinyl and the
 * stem the tonearm. The record spins on hover unless motion is reduced.
 */
</script>

<template>
  <svg class="mark" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <g class="mark__disc">
      <circle cx="56" cy="46" r="34" fill="currentColor" />
      <circle
        cx="56"
        cy="46"
        r="27"
        fill="none"
        stroke="var(--logo-groove)"
        stroke-opacity=".22"
        stroke-width="1.5"
      />
      <circle
        cx="56"
        cy="46"
        r="21"
        fill="none"
        stroke="var(--logo-groove)"
        stroke-opacity=".22"
        stroke-width="1.5"
      />
      <circle cx="56" cy="46" r="11" fill="var(--logo-accent)" />
      <path
        d="M50 42 A7 7 0 0 1 60 40"
        fill="none"
        stroke="var(--logo-bg)"
        stroke-opacity=".55"
        stroke-width="2"
        stroke-linecap="round"
      />
      <circle cx="56" cy="46" r="2.6" fill="var(--logo-bg)" />
    </g>
    <rect x="4" y="10" width="12" height="88" rx="6" fill="currentColor" />
    <circle cx="10" cy="14" r="9" fill="currentColor" />
    <circle cx="10" cy="14" r="3.2" fill="var(--logo-accent)" />
    <path
      d="M12 16 L36 30"
      stroke="currentColor"
      stroke-width="5"
      stroke-linecap="round"
    />
    <rect
      x="33"
      y="26"
      width="12"
      height="7"
      rx="2"
      transform="rotate(30 39 29.5)"
      fill="var(--logo-accent)"
    />
  </svg>
</template>

<style scoped>
.mark {
  display: block;
  block-size: 100%;
  inline-size: auto;
}
.mark__disc {
  transform-origin: 56px 46px;
  transform-box: view-box;
}
:global(a:hover) > .mark .mark__disc,
:global(a:focus-visible) > .mark .mark__disc {
  animation: spin 1.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  :global(a:hover) > .mark .mark__disc,
  :global(a:focus-visible) > .mark .mark__disc {
    animation: none;
  }
}
</style>
