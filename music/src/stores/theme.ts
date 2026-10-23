import { defineStore } from "pinia";
import { ref, watch } from "vue";

/** The user's colour-scheme choice; "system" follows the OS. */
export type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "pivi-theme";
const ORDER: readonly ThemeChoice[] = ["system", "light", "dark"];

/**
 * Reads the stored choice, tolerating blocked storage.
 * @returns The stored choice, or "system"
 */
function readStored(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return ORDER.includes(value as ThemeChoice)
      ? (value as ThemeChoice)
      : "system";
  } catch {
    return "system";
  }
}

/** Colour-scheme preference, mirrored on `<html data-theme>`. */
export const useThemeStore = defineStore("theme", () => {
  const choice = ref<ThemeChoice>(readStored());

  watch(
    choice,
    (value) => {
      const root = document.documentElement;
      if (value === "system") delete root.dataset.theme;
      else root.dataset.theme = value;
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        /* Private mode: the choice simply lasts for this visit. */
      }
    },
    { immediate: true },
  );

  /**
   * Moves to the next choice: system → light → dark → system.
   * @returns Nothing
   */
  function cycle(): void {
    choice.value =
      ORDER[(ORDER.indexOf(choice.value) + 1) % ORDER.length] ?? "system";
  }

  return { choice, cycle };
});
