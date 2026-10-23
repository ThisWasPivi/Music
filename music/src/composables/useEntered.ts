import { onMounted, type Ref, ref } from "vue";

/**
 * Flips to true one frame after mount, so CSS transitions can animate a
 * chart from its empty state to its values. Under reduced motion the
 * global stylesheet shortens every transition, so the chart simply appears.
 * @returns Whether the component has entered
 */
export function useEntered(): Ref<boolean> {
  const entered = ref(false);
  onMounted(() => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => (entered.value = true)),
    );
  });
  return entered;
}
