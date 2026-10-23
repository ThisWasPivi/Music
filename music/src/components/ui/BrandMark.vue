<script setup lang="ts">
/**
 * BrandMark component
 * The site logo: a "p" drawn as a record player, the bowl a vinyl and the
 * stem the tonearm. Only the record spins, on hover or keyboard focus of
 * the link around it, unless motion is reduced. The palette is fixed:
 * a midnight vinyl with an aurora label, so the logo stays recognisable
 * whatever the cover colours of the page.
 */
import { useId } from "vue";

const id = useId();
const label = `${id}-label`;
const disc = `${id}-disc`;
const rim = `${id}-rim`;
</script>

<template>
  <svg class="mark" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient :id="disc" cx="0.42" cy="0.38" r="0.7">
        <stop offset="0" stop-color="#2e2760" />
        <stop offset="1" stop-color="#0c0a1d" />
      </radialGradient>
      <linearGradient :id="label" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#a78bfa" />
        <stop offset="0.5" stop-color="#22d3ee" />
        <stop offset="1" stop-color="#f472b6" />
      </linearGradient>
      <linearGradient :id="rim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#a78bfa" />
        <stop offset="1" stop-color="#22d3ee" />
      </linearGradient>
    </defs>
    <g class="mark__disc">
      <circle
        cx="56"
        cy="46"
        r="33"
        :fill="`url(#${disc})`"
        :stroke="`url(#${rim})`"
        stroke-width="2"
      />
      <circle
        cx="56"
        cy="46"
        r="26.5"
        fill="none"
        stroke="#ffffff"
        stroke-opacity=".14"
        stroke-width="1.2"
      />
      <circle
        cx="56"
        cy="46"
        r="21"
        fill="none"
        stroke="#ffffff"
        stroke-opacity=".14"
        stroke-width="1.2"
      />
      <path
        d="M33 30 A27 27 0 0 1 52 20"
        fill="none"
        stroke="#ffffff"
        stroke-opacity=".35"
        stroke-width="2"
        stroke-linecap="round"
      />
      <circle cx="56" cy="46" r="11.5" :fill="`url(#${label})`" />
      <circle cx="56" cy="46" r="2.6" fill="#0c0a1d" />
    </g>
    <rect x="4" y="10" width="12" height="88" rx="6" fill="currentColor" />
    <circle cx="10" cy="14" r="9" fill="currentColor" />
    <circle cx="10" cy="14" r="3.2" fill="#22d3ee" />
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
      fill="#f472b6"
    />
  </svg>
</template>

<style scoped>
.mark {
  display: block;
  block-size: 100%;
  inline-size: auto;
  overflow: visible;
}
.mark__disc {
  transform-origin: 56px 46px;
  transform-box: view-box;
}
/* Only the record turns: the hovered or focused element is the link around the mark. */
:hover > .mark .mark__disc,
:focus-visible > .mark .mark__disc {
  animation: mark-spin 1.6s linear infinite;
}
@keyframes mark-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  :hover > .mark .mark__disc,
  :focus-visible > .mark .mark__disc {
    animation: none;
  }
}
</style>
