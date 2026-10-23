<script setup lang="ts">
/**
 * StatTile component
 * One headline figure with its label. Plain numbers ("635", "15%") count up
 * from zero when the tile appears or the figure changes; anything else
 * (durations, dates) is shown as is.
 */
import { onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
  /** What the figure measures. */
  label: string;

  /** The formatted figure. */
  value: string;

  /** Optional detail under the figure. */
  detail?: string;
}>();

/* Digits with optional grouping and a trailing %: the figures worth animating. */
const PLAIN_NUMBER = /^(\d[\d.,\u202f\u00a0]*)(\s?%)?$/;
const DURATION_MS = 900;

const shown = ref(props.value);
let frame = 0;

/**
 * Counts the figure up from zero, keeping the original formatting.
 * @param target - The formatted figure
 * @returns Nothing
 */
function countUp(target: string): void {
  cancelAnimationFrame(frame);
  const match = PLAIN_NUMBER.exec(target);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!match?.[1] || reduced) {
    shown.value = target;
    return;
  }
  const digits = match[1];
  const end = Number(digits.replace(/\D/g, ""));
  const separator = /[.,\u202f\u00a0]/.exec(digits)?.[0] ?? "";
  const suffix = match[2] ?? "";
  const start = performance.now();

  /**
   * Draws one frame of the count.
   * @param now - Frame timestamp
   * @returns Nothing
   */
  const step = (now: number): void => {
    const progress = Math.min(1, (now - start) / DURATION_MS);
    const eased = 1 - (1 - progress) ** 3;
    const current = Math.round(end * eased);
    shown.value = `${separator ? current.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator) : current}${suffix}`;
    if (progress < 1) frame = requestAnimationFrame(step);
    else shown.value = target;
  };
  frame = requestAnimationFrame(step);
}

watch(() => props.value, countUp, { immediate: true });
onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>

<template>
  <div class="tile glass">
    <p class="tile__label muted">{{ label }}</p>
    <p
      class="tile__value tabular"
      :class="{ 'tile__value--long': value.length > 7 }"
      :aria-label="value"
    >
      {{ shown }}
    </p>
    <p v-if="detail" class="tile__detail muted">{{ detail }}</p>
  </div>
</template>

<style scoped>
.tile {
  padding: 16px 18px;
  min-width: 0;
}
.tile p {
  margin: 0;
}
.tile__label {
  font-size: 13px;
}
.tile__value {
  font: 750 clamp(24px, 2.6vw, 32px) / 1.15 var(--font-display);
  letter-spacing: -0.02em;
  background: linear-gradient(90deg, var(--text), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.tile__value--long {
  font-size: clamp(20px, 1.9vw, 26px);
  white-space: nowrap;
}
.tile__detail {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
