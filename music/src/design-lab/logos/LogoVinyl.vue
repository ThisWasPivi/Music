<script setup lang="ts">
/**
 * LogoVinyl component
 * The "p" as a record player: the bowl is a vinyl, the stem the tonearm.
 * `mark` draws the "p" alone (favicon); `wordmark` adds | ▷ | for "ivi".
 */
withDefaults(
  defineProps<{
    /** Accessible name. */
    title?: string;

    /** Mark alone, or the full "pivi" wordmark. */
    variant?: "mark" | "wordmark";

    /** Lets the record spin on hover. */
    spin?: boolean;
  }>(),
  { title: "pivi", variant: "mark", spin: true },
);
</script>

<template>
  <svg
    class="logo"
    :class="{ 'logo--spin': spin }"
    :viewBox="variant === 'mark' ? '0 0 100 100' : '0 0 196 100'"
    role="img"
    :aria-label="title"
  >
    <g class="logo__disc">
      <circle cx="56" cy="46" r="34" fill="currentColor" />
      <circle
        cx="56"
        cy="46"
        r="27"
        fill="none"
        stroke="var(--logo-groove, #ffffff)"
        stroke-opacity=".22"
        stroke-width="1.5"
      />
      <circle
        cx="56"
        cy="46"
        r="21"
        fill="none"
        stroke="var(--logo-groove, #ffffff)"
        stroke-opacity=".22"
        stroke-width="1.5"
      />
      <circle cx="56" cy="46" r="11" fill="var(--logo-accent, currentColor)" />
      <path
        d="M50 42 A7 7 0 0 1 60 40"
        fill="none"
        stroke="var(--logo-bg, #ffffff)"
        stroke-opacity=".55"
        stroke-width="2"
        stroke-linecap="round"
      />
      <circle cx="56" cy="46" r="2.6" fill="var(--logo-bg, #ffffff)" />
    </g>
    <rect x="4" y="10" width="12" height="88" rx="6" fill="currentColor" />
    <circle cx="10" cy="14" r="9" fill="currentColor" />
    <circle cx="10" cy="14" r="3.2" fill="var(--logo-accent, currentColor)" />
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
      fill="var(--logo-accent, currentColor)"
    />
    <template v-if="variant === 'wordmark'">
      <rect x="104" y="20" width="14" height="48" rx="4" fill="currentColor" />
      <path
        d="M133 23 L133 65 L167 44 Z"
        fill="var(--logo-accent, currentColor)"
        stroke="var(--logo-accent, currentColor)"
        stroke-width="6"
        stroke-linejoin="round"
      />
      <rect x="180" y="20" width="14" height="48" rx="4" fill="currentColor" />
    </template>
  </svg>
</template>

<style scoped>
.logo {
  display: block;
  block-size: 100%;
  inline-size: auto;
}
.logo__disc {
  transform-origin: 56px 46px;
  transform-box: view-box;
}
.logo--spin:hover .logo__disc {
  animation: spin 1.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .logo--spin:hover .logo__disc {
    animation: none;
  }
}
</style>
