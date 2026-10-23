import sharp from "sharp";

/**
 * A colour bucket being accumulated.
 * @property count - Pixels in the bucket
 * @property r - Sum of red values
 * @property g - Sum of green values
 * @property b - Sum of blue values
 */
interface Bucket {
  count: number;
  r: number;
  g: number;
  b: number;
}

/**
 * Formats an RGB triple as `#rrggbb`.
 * @param r - Red, 0–255
 * @param g - Green, 0–255
 * @param b - Blue, 0–255
 * @returns The hex colour
 */
function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Finds the dominant colours of an image from its raw RGB pixels.
 *
 * Pixels are bucketed on a 4-bit-per-channel grid, buckets are ranked by
 * size, and a colour is kept only if it is far enough from those already
 * picked, so the palette is varied rather than five shades of one blue.
 * @param pixels - Packed RGB bytes (3 per pixel)
 * @param count - Number of colours wanted
 * @param minDistance - Minimum RGB distance between two picked colours
 * @returns Up to `count` colours, most dominant first
 */
export function extractPalette(
  pixels: Uint8Array,
  count = 4,
  minDistance = 48,
): string[] {
  const buckets = new Map<number, Bucket>();
  for (let index = 0; index + 2 < pixels.length; index += 3) {
    const r = pixels[index] ?? 0;
    const g = pixels[index + 1] ?? 0;
    const b = pixels[index + 2] ?? 0;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const ranked = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .map(
      (bucket) =>
        [
          bucket.r / bucket.count,
          bucket.g / bucket.count,
          bucket.b / bucket.count,
        ] as const,
    );

  const picked: (readonly [number, number, number])[] = [];
  for (const color of ranked) {
    if (picked.length >= count) break;
    const distinct = picked.every(
      (other) =>
        Math.hypot(
          color[0] - other[0],
          color[1] - other[1],
          color[2] - other[2],
        ) >= minDistance,
    );
    if (distinct) picked.push(color);
  }
  return picked.map(([r, g, b]) => toHex(r, g, b));
}

/**
 * Downloads a cover and extracts its palette.
 * @param url - Image URL
 * @param fetchImpl - Fetch implementation
 * @returns The palette, empty when the image cannot be read
 */
export async function paletteFromUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  try {
    const response = await fetchImpl(url);
    if (!response.ok) return [];
    const input = Buffer.from(await response.arrayBuffer());
    const pixels = await sharp(input)
      .resize(48, 48, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer();
    return extractPalette(pixels);
  } catch {
    return [];
  }
}
