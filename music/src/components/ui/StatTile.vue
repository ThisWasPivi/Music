<script setup lang="ts">
/**
 * StatTile component
 * One headline figure with its label.
 */
defineProps<{
  /** What the figure measures. */
  label: string;

  /** The formatted figure. */
  value: string;

  /** Optional detail under the figure. */
  detail?: string;
}>();
</script>

<template>
  <div class="tile glass">
    <p class="tile__label muted">{{ label }}</p>
    <p
      class="tile__value tabular"
      :class="{ 'tile__value--long': value.length > 7 }"
    >
      {{ value }}
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
