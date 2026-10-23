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
 * Picks black or white text for the best contrast on a background.
 * @param hex - The background colour
 * @returns "#000000" or "#ffffff"
 */
export function readableTextOn(hex: string): string {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!match) return "#000000";
  const [r, g, b] = match.slice(1).map((part) => {
    const channel = Number.parseInt(part, 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
