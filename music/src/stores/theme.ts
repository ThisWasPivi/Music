import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

/** The colour-scheme choice; "system" follows the OS until the user picks one. */
export type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "pivi-theme";

/**
 * Reads the stored choice, tolerating blocked storage.
 * @returns The stored choice, or "system"
 */
function readStored(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

/** Colour-scheme preference, mirrored on `<html data-theme>`. */
export const useThemeStore = defineStore("theme", () => {
  const choice = ref<ThemeChoice>(readStored());
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const systemDark = ref(media.matches);
  media.addEventListener(
    "change",
    (event) => (systemDark.value = event.matches),
  );

  /** The theme actually on screen. */
  const resolved = computed<"light" | "dark">(() =>
    choice.value === "system"
      ? systemDark.value
        ? "dark"
        : "light"
      : choice.value,
  );

  watch(
    choice,
    (value) => {
      const root = document.documentElement;
      if (value === "system") delete root.dataset.theme;
      else root.dataset.theme = value;
      try {
        if (value === "system") localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, value);
      } catch {
        /* Private mode: the choice lasts for this visit. */
      }
    },
    { immediate: true },
  );

  /**
   * Switches to the opposite of what is on screen, so one click always
   * changes the theme.
   * @returns Nothing
   */
  function toggle(): void {
    choice.value = resolved.value === "dark" ? "light" : "dark";
  }

  return { choice, resolved, toggle };
});
