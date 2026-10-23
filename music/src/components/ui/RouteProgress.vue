<script setup lang="ts">
/**
 * RouteProgress component
 * A thin aurora bar along the top edge while a page and its code load.
 * It only appears when loading takes longer than a blink, then fills and
 * fades out.
 */
import { onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const state = ref<"idle" | "loading" | "done">("idle");
let timer: ReturnType<typeof setTimeout> | undefined;

const removeBefore = router.beforeEach(() => {
  clearTimeout(timer);
  /* Instant navigations should not flash a bar. */
  timer = setTimeout(() => (state.value = "loading"), 90);
});

/**
 * Completes the bar and hides it.
 * @returns Nothing
 */
function finish(): void {
  clearTimeout(timer);
  if (state.value !== "loading") {
    state.value = "idle";
    return;
  }
  state.value = "done";
  timer = setTimeout(() => (state.value = "idle"), 450);
}

const removeAfter = router.afterEach(finish);
const removeError = router.onError(finish);

onBeforeUnmount(() => {
  clearTimeout(timer);
  removeBefore();
  removeAfter();
  removeError();
});
</script>

<template>
  <div class="progress" :class="`progress--${state}`" aria-hidden="true">
    <span class="progress__bar" />
  </div>
</template>

<style scoped>
.progress {
  position: fixed;
  inset: env(safe-area-inset-top, 0px) 0 auto;
  z-index: 200;
  block-size: 3px;
  pointer-events: none;
}
.progress__bar {
  display: block;
  block-size: 100%;
  inline-size: 0;
  background: linear-gradient(90deg, var(--c1), var(--c2), var(--c3));
  box-shadow: 0 0 12px var(--c2);
  opacity: 0;
}
.progress--loading .progress__bar {
  opacity: 1;
  animation: progress-grow 8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
}
.progress--done .progress__bar {
  inline-size: 100%;
  opacity: 0;
  transition:
    inline-size 200ms ease,
    opacity 300ms ease 150ms;
}
@keyframes progress-grow {
  from {
    inline-size: 0;
  }
  to {
    inline-size: 90%;
  }
}
</style>
