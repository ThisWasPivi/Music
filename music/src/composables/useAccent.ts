import {
  type MaybeRefOrGetter,
  onBeforeUnmount,
  toValue,
  watchEffect,
} from "vue";

import { accentFromPalette, withContrast } from "@/utils/color.ts";

/*
 * Accent text must stay readable on any cover colour. Checked against the
 * lightest light-theme surface and the darkest dark-theme one, with margin
 * for the translucent glass in between.
 */
const LIGHT_SURFACE = "#e2e4ec";
const DARK_SURFACE = "#1a1924";
const PROPERTIES = [
  "--c1",
  "--c2",
  "--c3",
  "--accent-on-light",
  "--accent-on-dark",
] as const;

/**
 * Paints the page's accents on `<html>` with a cover palette while the
 * calling component is mounted: `--c1`…`--c3` for fills and glows, and two
 * text accents with WCAG AA contrast for each theme.
 * @param palette - Cover colours, reactive
 * @returns Nothing
 */
export function useAccent(
  palette: MaybeRefOrGetter<readonly string[] | undefined>,
): void {
  const root = document.documentElement;
  watchEffect(() => {
    const accent = accentFromPalette(toValue(palette) ?? []);
    root.style.setProperty("--c1", accent.c1);
    root.style.setProperty("--c2", accent.c2);
    root.style.setProperty("--c3", accent.c3);
    root.style.setProperty(
      "--accent-on-light",
      withContrast(accent.c1, LIGHT_SURFACE, 4.8),
    );
    root.style.setProperty(
      "--accent-on-dark",
      withContrast(accent.c2, DARK_SURFACE, 4.8),
    );
  });
  onBeforeUnmount(() => {
    for (const name of PROPERTIES) root.style.removeProperty(name);
  });
}
