<script setup lang="ts">
/**
 * LabScreen component
 * Labelled frame around one mock-up screen of a design direction.
 */
defineProps<{
  /** Anchor id for the lab's screen navigation. */
  id: string;

  /** Caption shown above the frame. */
  label: string;
}>();
</script>

<template>
  <section :id="id" class="screen" :aria-label="label">
    <h2 class="screen__label">{{ label }}</h2>
    <div class="screen__frame">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.screen {
  scroll-margin-top: 120px;
  margin-bottom: 40px;
}
.screen__label {
  margin: 0 0 8px;
  font:
    600 12px/1.2 ui-sans-serif,
    system-ui,
    sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #55555f;
}
.screen__frame {
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.08),
    0 12px 32px rgb(0 0 0 / 0.12);
}
</style>
