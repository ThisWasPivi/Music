import { readonly, ref } from "vue";

const open = ref(false);

/**
 * Shared open state of the search palette, so the header button, the
 * keyboard shortcut and the palette itself agree.
 * @returns The state and its controls
 */
export function usePalette() {
  return {
    isOpen: readonly(open),

    /**
     * Opens the palette.
     * @returns Nothing
     */
    show: (): void => {
      open.value = true;
    },

    /**
     * Closes the palette.
     * @returns Nothing
     */
    hide: (): void => {
      open.value = false;
    },
  };
}
