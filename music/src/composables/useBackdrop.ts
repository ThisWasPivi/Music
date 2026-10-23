import {
  type MaybeRefOrGetter,
  onBeforeUnmount,
  ref,
  toValue,
  watchEffect,
} from "vue";

/** Cover image painted, blurred, behind the whole page; null for none. */
export const backdropImage = ref<string | null>(null);

/**
 * Shows a cover as the full-page backdrop while the calling component is
 * mounted.
 * @param image - Image URL, reactive
 * @returns Nothing
 */
export function useBackdrop(
  image: MaybeRefOrGetter<string | null | undefined>,
): void {
  watchEffect(() => {
    backdropImage.value = toValue(image) ?? null;
  });
  onBeforeUnmount(() => {
    backdropImage.value = null;
  });
}
