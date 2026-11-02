<script setup lang="ts">
/**
 * AppTooltip component
 * The single themed tooltip driven by the `v-tooltip` directive. It is
 * measured once rendered, then placed above its anchor (or below when
 * there is no room) and slid sideways so it always stays a margin inside
 * the screen, however wide it is and wherever the anchor sits.
 */
import { nextTick, ref, watch } from "vue";

import { tooltip, TOOLTIP_ID } from "@/composables/useTooltip.ts";

/* Distance from the screen edges and from the anchor, in pixels. */
const EDGE = 8;
const GAP = 10;

const element = ref<HTMLElement | null>(null);
const position = ref({ left: 0, top: 0 });
const below = ref(false);
/* Hidden until measured, so it never flashes in the wrong place. */
const placed = ref(false);

/**
 * Measures the tooltip and fits it inside the viewport.
 * @returns Nothing
 */
function place(): void {
  const tip = element.value;
  if (!tip) return;
  const width = tip.offsetWidth;
  const height = tip.offsetHeight;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;

  const left = Math.min(
    Math.max(tooltip.x - width / 2, EDGE),
    Math.max(EDGE, viewportWidth - width - EDGE),
  );
  const fitsAbove = tooltip.top - GAP - height >= EDGE;
  below.value = !fitsAbove;
  const top = fitsAbove
    ? tooltip.top - GAP - height
    : Math.min(tooltip.bottom + GAP, viewportHeight - height - EDGE);
  position.value = { left, top: Math.max(EDGE, top) };
  placed.value = true;
}

watch(
  () => [
    tooltip.visible,
    tooltip.text,
    tooltip.detail,
    tooltip.image,
    tooltip.x,
    tooltip.top,
  ],
  async () => {
    placed.value = false;
    if (!tooltip.visible) return;
    await nextTick();
    place();
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="tip">
      <div
        v-show="tooltip.visible"
        :id="TOOLTIP_ID"
        ref="element"
        role="tooltip"
        class="tip glass-pop"
        :class="{ 'tip--below': below }"
        :style="{
          left: `${position.left}px`,
          top: `${position.top}px`,
          visibility: placed ? 'visible' : 'hidden',
        }"
      >
        <img
          v-if="tooltip.image"
          :src="tooltip.image"
          alt=""
          class="tip__image"
          width="40"
          height="40"
        />
        <span class="tip__text">
          <strong v-if="tooltip.detail || tooltip.image">{{
            tooltip.text
          }}</strong>
          <template v-else>{{ tooltip.text }}</template>
          <span v-if="tooltip.detail" class="tip__detail">{{
            tooltip.detail
          }}</span>
        </span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tip {
  position: fixed;
  z-index: 100;
  max-inline-size: min(280px, calc(100vw - 16px));
  box-sizing: border-box;
  overflow-wrap: anywhere;
  padding: 7px 12px;
  border-radius: 12px;
  color: var(--text);
  font: 500 13px/1.35 var(--font-body);
  text-align: start;
  text-wrap: pretty;
  pointer-events: none;
}
.tip:has(.tip__image) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
}
.tip__image {
  flex: none;
  inline-size: 40px;
  block-size: 40px;
  border-radius: 8px;
  object-fit: cover;
}
.tip__text {
  display: grid;
  gap: 1px;
}
.tip__detail {
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}
.tip-enter-active,
.tip-leave-active {
  transition:
    opacity 140ms ease,
    margin 140ms ease;
}
.tip-enter-from,
.tip-leave-to {
  opacity: 0;
  margin-top: 4px;
}
.tip--below.tip-enter-from,
.tip--below.tip-leave-to {
  margin-top: -4px;
}
</style>
