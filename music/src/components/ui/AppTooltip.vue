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
        class="tip"
        :class="{ 'tip--below': below }"
        :style="style"
      >
        {{ tooltip.text }}
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
  border: 1px solid var(--glass-border);
  background: var(--glass-strong);
  backdrop-filter: blur(18px) saturate(1.4);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
  box-shadow: var(--shadow);
  color: var(--text);
  font: 500 13px/1.35 var(--font-body);
  text-align: center;
  pointer-events: none;
  transform: translate(-50%, -100%);
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
