import { onBeforeUnmount, type Ref, ref } from "vue";

/**
 * Tracks a CSS media query, e.g. to give a chart a phone layout.
 * @param query - The media query
 * @returns Whether it currently matches
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const list =
    typeof window === "undefined" || !window.matchMedia
      ? undefined
      : window.matchMedia(query);
  const matches = ref(list?.matches ?? false);

  /**
   * Mirrors a change of the query.
   * @param event - The change
   * @returns Nothing
   */
  const update = (event: MediaQueryListEvent): void => {
    matches.value = event.matches;
  };
  list?.addEventListener("change", update);
  onBeforeUnmount(() => list?.removeEventListener("change", update));
  return matches;
}
