<script setup lang="ts">
/**
 * AppTooltip component
 * The single themed tooltip driven by the `v-tooltip` directive. It sits
 * above its anchor, or below when there is no room at the top.
 */
import { computed } from "vue";

import { tooltip, TOOLTIP_ID } from "@/composables/useTooltip.ts";

const below = computed(() => tooltip.top < 72);
const style = computed(() => ({
  left: `${Math.min(Math.max(tooltip.x, 12), window.innerWidth - 12)}px`,
  top: `${below.value ? tooltip.bottom + 10 : tooltip.top - 10}px`,
}));
</script>

<template>
  <Teleport to="body">
    <Transition name="tip">
      <div
        v-show="tooltip.visible"
        :id="TOOLTIP_ID"
        role="tooltip"
        class="tip glass-pop"
        :class="{ 'tip--below': below }"
        :style="style"
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
  max-inline-size: min(280px, calc(100vw - 24px));
  padding: 7px 12px;
  border-radius: 12px;
  color: var(--text);
  font: 500 13px/1.35 var(--font-body);
  text-align: start;
  text-wrap: pretty;
  pointer-events: none;
  transform: translate(-50%, -100%);
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
.tip--below {
  transform: translate(-50%, 0);
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
</style>
