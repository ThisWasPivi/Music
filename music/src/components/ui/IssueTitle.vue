<script setup lang="ts">
/**
 * IssueTitle component
 * A playlist name with its issue number painted in the aurora gradient,
 * e.g. "Pivəəkly" + gradient "24".
 */
import { computed } from "vue";

const props = defineProps<{
  /** The playlist name. */
  name: string;
}>();

/* Splits off the trailing number (with an optional "#" or "Nº") so only it gets the gradient. */
const parts = computed(() => {
  const match = /^(.*?)(\s*(?:#|nº\s*|n\.\s*)?\d+)(.*)$/iu.exec(props.name);
  return match
    ? { head: match[1] ?? "", number: match[2] ?? "", tail: match[3] ?? "" }
    : { head: props.name, number: "", tail: "" };
});
</script>

<template>
  <span>
    {{ parts.head
    }}<span v-if="parts.number" class="grad">{{ parts.number }}</span
    >{{ parts.tail }}
  </span>
</template>
