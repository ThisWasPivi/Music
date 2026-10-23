/**
 * A colour in HSL space.
 * @property hue - Degrees in [0, 360)
 * @property saturation - In [0, 1]
 * @property lightness - In [0, 1]
 */
export interface Hsl {
  hue: number;
  saturation: number;
  lightness: number;
}

/**
 * Parses `#rrggbb` into HSL.
 * @param hex - The colour
 * @returns The HSL components; invalid input reads as black
 */
export function hexToHsl(hex: string): Hsl {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!match) return { hue: 0, saturation: 0, lightness: 0 };
  const [r, g, b] = match
    .slice(1)
    .map((part) => Number.parseInt(part, 16) / 255) as [number, number, number];

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0, lightness };

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return { hue: (hue * 60 + 360) % 360, saturation, lightness };
}

/**
 * Orders colours along the rainbow, with greys after every hue.
 * @param hex - The colour
 * @returns A sort key: lower comes first
 */
export function colorSortKey(hex: string): number {
  const { hue, saturation, lightness } = hexToHsl(hex);
  /* Near-greys have no meaningful hue: park them after 360°, dark to light. */
  if (saturation < 0.12) return 400 + lightness;
  return hue;
}

/**
 * Formats HSL components as `#rrggbb`.
 * @param color - The HSL colour
 * @param color.hue
 * @param color.saturation
 * @param color.lightness
 * @returns The hex colour
 */
export function hslToHex({ hue, saturation, lightness }: Hsl): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;

  /**
   * Computes one RGB channel.
   * @param offset - The channel's offset on the hue wheel
   * @returns The channel as two hex digits
   */
  const channel = (offset: number): string => {
    const k = (offset + hue / 30) % 12;
    const value =
      lightness - (chroma / 2) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/**
 * The three accent colours of a page.
 * @property c1 - Primary accent
 * @property c2 - Secondary accent
 * @property c3 - Tertiary accent
 */
export interface Accent {
  c1: string;
  c2: string;
  c3: string;
}

/** Used when a playlist has no cover colours. */
export const DEFAULT_ACCENT: Accent = {
  c1: "#7c3aed",
  c2: "#22d3ee",
  c3: "#f472b6",
};

/**
 * Keeps a cover colour usable as an accent: a near-black or washed-out
 * cover colour would vanish against the dark background, so lightness and
 * saturation are clamped into a vivid band. Greys stay greys.
 * @param hex - A cover colour
 * @returns The adjusted colour
 */
export function vivid(hex: string): string {
  const hsl = hexToHsl(hex);
  if (hsl.saturation < 0.08)
    return hslToHex({
      ...hsl,
      lightness: Math.min(0.75, Math.max(0.55, hsl.lightness)),
    });
  return hslToHex({
    hue: hsl.hue,
    saturation: Math.max(0.45, hsl.saturation),
    lightness: Math.min(0.68, Math.max(0.52, hsl.lightness)),
  });
}

/**
 * Derives a page's accents from a cover palette.
 * @param palette - Cover colours, most dominant first
 * @returns Three accents, falling back to the defaults
 */
export function accentFromPalette(palette: readonly string[]): Accent {
  const [first, second, third] = palette.map(vivid);
  if (!first) return DEFAULT_ACCENT;
  return { c1: first, c2: second ?? first, c3: third ?? second ?? first };
}

/**
 * Relative luminance of a colour, per WCAG.
 * @param hex - The colour
 * @returns Luminance in [0, 1]
 */
export function luminance(hex: string): number {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!match) return 0;
  const [r, g, b] = match.slice(1).map((part) => {
    const channel = Number.parseInt(part, 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio of two colours.
 * @param a - First colour
 * @param b - Second colour
 * @returns The ratio, from 1 to 21
 */
export function contrastRatio(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (high + 0.05) / (low + 0.05);
}

/**
 * Darkens or lightens a colour, keeping its hue, until it reaches a
 * contrast ratio against a background.
 * @param hex - The colour
 * @param background - The background it sits on
 * @param minimum - Required ratio, 4.5 for WCAG AA text
 * @returns The adjusted colour
 */
export function withContrast(
  hex: string,
  background: string,
  minimum = 4.5,
): string {
  const hsl = hexToHsl(hex);
  const step = luminance(background) > 0.5 ? -0.02 : 0.02;
  for (
    let lightness = hsl.lightness;
    lightness >= 0 && lightness <= 1;
    lightness += step
  ) {
    const candidate = hslToHex({ ...hsl, lightness });
    if (contrastRatio(candidate, background) >= minimum) return candidate;
  }
  return step < 0 ? "#000000" : "#ffffff";
}
