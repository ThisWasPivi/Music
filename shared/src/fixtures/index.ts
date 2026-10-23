/**
 * Invented sample data, so the app can be designed and tested without a
 * Spotify login. Every name, id and number here is made up; the generator is
 * seeded, so the output is identical on every run.
 */
import type {
  AlbumRef,
  ArtistProfile,
  ArtistRef,
  Playlist,
  Rotation,
  Track,
} from "../domain.ts";

/**
 * A seeded pseudo-random source.
 * @property next - Returns a float in [0, 1)
 * @property int - Returns an integer in [min, max]
 * @property pick - Returns a random element of a non-empty list
 */
interface Random {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
}

/**
 * Creates a mulberry32 generator, small and good enough for fixtures.
 * @param seed - Any 32-bit integer
 * @returns The seeded random source
 */
function createRandom(seed: number): Random {
  let state = seed >>> 0;

  /**
   * Advances the generator.
   * @returns A float in [0, 1)
   */
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  /**
   * Draws an integer.
   * @param min - Inclusive lower bound
   * @param max - Inclusive upper bound
   * @returns An integer in [min, max]
   */
  const int = (min: number, max: number): number =>
    min + Math.floor(next() * (max - min + 1));

  /**
   * Draws a list element.
   * @param items - A non-empty list
   * @returns One of its elements
   */
  const pick = <T>(items: readonly T[]): T =>
    items[int(0, items.length - 1)] as T;

  return { next, int, pick };
}

const ARTIST_NAMES = [
  "Velvet Harbour",
  "Nora Kessel",
  "The Midnight Cartographers",
  "Lumen Drift",
  "Okra Sunday",
  "Juno Vale",
  "Paper Satellites",
  "Marisol Ferro",
  "Glass Tigers",
  "Ottavio Brume",
  "Saltwater Choir",
  "Kiki Moreau",
  "North of Nowhere",
  "Dune Pilots",
  "Hollow Palms",
  "Ines Larue",
  "Static Orchard",
  "Bruno Calce",
  "Neon Gondola",
  "The Quiet Arcade",
  "Mira Solano",
  "Fax Machine Romance",
  "Low Tide Society",
  "Amaro Club",
  "Tessa Mint",
  "Copper Lanterns",
  "Echo Valley Twins",
  "Ruben Okafor",
  "Pale Blue Motel",
  "Sofia Ambra",
  "Winter Pavilion",
  "Gelato Disco",
  "Theo Marchetti",
  "Cassette Ghosts",
  "Lago Nero",
  "Yuki Harrow",
  "Orbit & Ivy",
  "The Sunday Crowns",
  "Vera Lux",
  "Cobalt Avenue",
  "Nico Brisa",
  "Moth Radio",
  "Little Atlas",
  "Ada Fontaine",
  "Tropic Static",
  "Bassa Marea",
  "June Hollow",
  "Fennel & Fig",
] as const;

const TITLE_WORDS = [
  "Satellite",
  "Honey",
  "Midnight",
  "Paper",
  "Gold",
  "Riviera",
  "Ghost",
  "Lemon",
  "Velvet",
  "Static",
  "Neon",
  "Echo",
  "Summer",
  "Harbour",
  "Signal",
  "Orbit",
  "Cherry",
  "Mirror",
  "Salt",
  "Window",
  "Polaroid",
  "Highway",
  "Fever",
  "Glow",
  "Marble",
  "Tangerine",
  "Lullaby",
  "Comet",
  "Pulse",
] as const;

const TITLE_TAILS = [
  "Dreams",
  "Love",
  "Lights",
  "Blues",
  "Heart",
  "Season",
  "Run",
  "Waves",
  "Talk",
  "Again",
  "Tonight",
  "Forever",
  "Song",
  "Party",
  "Machine",
  "Days",
] as const;

const MOODS = [
  "chill",
  "upbeat",
  "indie",
  "night",
  "summer",
  "electronic",
  "acoustic",
  "rainy",
] as const;

/*
 * Issue numbers and the days since the series start at which each came out.
 * Irregular on purpose: dense runs, long pauses, and two missing numbers
 * (7 and 15) so the timeline and the gap detection have something to show.
 */
const ISSUES: readonly (readonly [number | null, number])[] = [
  [1, 0],
  [2, 9],
  [3, 16],
  [4, 41],
  [5, 47],
  [6, 120],
  [8, 131],
  [9, 135],
  [10, 170],
  [11, 230],
  [12, 238],
  [13, 244],
  [14, 302],
  [16, 395],
  [17, 401],
  [18, 412],
  [19, 470],
  [20, 520],
  [21, 526],
  [22, 600],
  [23, 690],
  [24, 702],
  [null, 715],
];

const SERIES_START = Date.UTC(2024, 0, 14, 18, 30);
const DAY_MS = 86_400_000;

/**
 * Builds an id that looks like a Spotify base62 id but is clearly fake.
 * @param kind - A short type marker
 * @param index - A unique index within that type
 * @returns The fake id
 */
function fakeId(kind: string, index: number): string {
  return `fx${kind}${index.toString(36).padStart(4, "0")}`.padEnd(22, "0");
}

/**
 * Formats an HSL colour as `#rrggbb`.
 * @param hue - Hue in degrees
 * @param saturation - Saturation in [0, 1]
 * @param lightness - Lightness in [0, 1]
 * @returns The hex colour
 */
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;

  /**
   * Computes one RGB channel of the HSL colour.
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
 * Draws an abstract gradient cover as an inline SVG data URI.
 * @param palette - The cover colours, most dominant first
 * @param label - Text printed on the cover
 * @returns The data URI
 */
function coverDataUri(palette: readonly string[], label: string): string {
  const [base = "#333333", second = "#666666", third = "#999999"] = palette;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="${second}"/></linearGradient></defs>` +
    `<rect width="300" height="300" fill="url(#g)"/>` +
    `<circle cx="215" cy="85" r="70" fill="${third}" opacity=".85"/>` +
    `<text x="24" y="274" font-family="Montserrat, sans-serif" font-weight="800" font-size="34" fill="#fff">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Draws a small abstract album cover as an inline SVG data URI.
 * @param base - Background colour
 * @param accent - Shape colour
 * @param shape - Which of three motifs to draw
 * @returns The data URI
 */
function albumCoverDataUri(
  base: string,
  accent: string,
  shape: number,
): string {
  const motif = [
    `<circle cx="50" cy="50" r="28" fill="${accent}"/>`,
    `<rect x="22" y="22" width="56" height="56" rx="6" fill="${accent}" transform="rotate(12 50 50)"/>`,
    `<path d="M0 70 Q50 30 100 70 V100 H0Z" fill="${accent}"/>`,
  ][shape];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${base}"/>${motif}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * The complete fixture catalogue.
 * @property playlists - Pivəəkly issues with their tracks
 * @property artists - Profiles for the most frequent artists
 * @property rotation - Sample "in rotation" data
 */
export interface FixtureCatalog {
  playlists: Playlist[];
  artists: ArtistProfile[];
  rotation: Rotation;
}

/**
 * Generates the sample catalogue.
 * @param seed - Seed for the generator; the default gives the committed data
 * @returns The fixture catalogue
 */
export function createFixtureCatalog(seed = 20240114): FixtureCatalog {
  const random = createRandom(seed);

  /* Beyond the hand-written names, derive more so later issues can discover new artists. */
  const names = [
    ...ARTIST_NAMES,
    ...TITLE_WORDS.flatMap((word, index) => [
      `The ${word} ${TITLE_TAILS[index % TITLE_TAILS.length]}`,
    ]),
    ...TITLE_TAILS.map(
      (tail, index) =>
        `${TITLE_WORDS[(index * 7) % TITLE_WORDS.length]} ${tail} Club`,
    ),
  ];
  const artists: ArtistRef[] = names.map((name, index) => {
    const id = fakeId("ar", index);
    return { id, name, url: `https://open.spotify.com/artist/${id}` };
  });

  /* How many artists the series "knows" so far; it grows with every issue. */
  let reach = 14;

  /**
   * Draws an artist with a popularity skew: the first artists in the list
   * recur far more often, like the favourites of a real series, while
   * newer issues can reach artists never heard before.
   * @returns The artist
   */
  const pickArtist = (): ArtistRef =>
    artists[
      Math.floor(random.next() ** 1.6 * Math.min(reach, artists.length))
    ] as ArtistRef;

  const albums = new Map<string, AlbumRef & { year: number }>();
  let trackIndex = 0;
  const trackPool: Track[] = [];

  /**
   * Creates a brand-new track by a random artist.
   * @returns The track, without its `addedAt`
   */
  const newTrack = (): Track => {
    const lead = pickArtist();
    const credits =
      random.next() < 0.18
        ? [lead, pickArtist()].filter(
            (artist, i, all) => all.indexOf(artist) === i,
          )
        : [lead];
    const albumKey = `${lead.id}-${random.int(0, 2)}`;
    let album = albums.get(albumKey);
    if (!album) {
      const id = fakeId("al", albums.size);
      const decadeRoll = random.next();
      const year =
        decadeRoll < 0.08
          ? random.int(1968, 1989)
          : decadeRoll < 0.22
            ? random.int(1990, 2009)
            : random.int(2010, 2026);
      const hue = random.int(0, 359);
      album = {
        id,
        name: `${random.pick(TITLE_WORDS)} ${random.pick(TITLE_TAILS)}`,
        url: `https://open.spotify.com/album/${id}`,
        imageUrl: albumCoverDataUri(
          hslToHex(hue, 0.55, 0.45),
          hslToHex((hue + 50) % 360, 0.65, 0.62),
          random.int(0, 2),
        ),
        year,
      };
      albums.set(albumKey, album);
    }
    const id = fakeId("tr", trackIndex);
    trackIndex += 1;
    const { year, ...albumRef } = album;
    return {
      id,
      title: `${random.pick(TITLE_WORDS)} ${random.pick(TITLE_TAILS)}`,
      artists: credits,
      album: albumRef,
      releaseYear: year,
      durationMs: random.int(118, 412) * 1000 + random.int(0, 999),
      explicit: random.next() < 0.14,
      addedAt: "",
      url: `https://open.spotify.com/track/${id}`,
    };
  };

  const playlists: Playlist[] = ISSUES.map(([number, day], issueIndex) => {
    reach = 14 + issueIndex * 4;
    const id = fakeId("pl", issueIndex);
    const hue = (issueIndex * 47 + random.int(0, 40)) % 360;
    /*
     * Every third issue gets a muted, photo-like palette (greys with one
     * weak tint), like real covers made from photographs.
     */
    const muted = issueIndex % 3 === 1;
    const palette = muted
      ? [
          hslToHex(hue, 0.08, 0.32),
          hslToHex((hue + 20) % 360, 0.06, 0.62),
          hslToHex(hue, 0.3, 0.45),
          hslToHex(0, 0, 0.12),
        ]
      : [
          hslToHex(hue, 0.62, 0.42),
          hslToHex((hue + 38) % 360, 0.7, 0.58),
          hslToHex((hue + 180) % 360, 0.55, 0.7),
          hslToHex((hue + 210) % 360, 0.35, 0.22),
        ];
    const name =
      number === null
        ? "Pivəəkly — Rarities"
        : number % 5 === 0
          ? `Pivəəkly #${number}`
          : `Pivəəkly ${number}`;
    const start = SERIES_START + day * DAY_MS;

    const count = random.int(18, 34);
    const tracks: Track[] = [];
    for (let position = 0; position < count; position += 1) {
      /* Roughly one track in twelve is a repeat from an earlier issue. */
      const reuse = trackPool.length > 40 && random.next() < 0.08;
      const base = reuse ? random.pick(trackPool) : newTrack();
      if (!reuse) trackPool.push(base);
      if (tracks.some((track) => track.id === base.id)) continue;
      /* Most tracks land on release day; a few trickle in over the next days. */
      const offset =
        random.next() < 0.8
          ? random.int(0, 3_600_000)
          : random.int(1, 6) * DAY_MS;
      tracks.push({ ...base, addedAt: new Date(start + offset).toISOString() });
    }

    const added = tracks.map((track) => track.addedAt).sort();
    return {
      id,
      name,
      number,
      description:
        number === null
          ? "Leftovers, B-sides and songs that never fit a numbered issue."
          : `Issue ${number} of the series. ${random.pick(["Late-night drives", "Sunday mornings", "Rainy commutes", "Kitchen dancing", "Long flights"])} and everything in between.`,
      coverUrl: coverDataUri(palette, name.replace("—", "·")),
      url: `https://open.spotify.com/playlist/${id}`,
      trackCount: tracks.length,
      durationMs: tracks.reduce((sum, track) => sum + track.durationMs, 0),
      firstAddedAt: added[0] ?? null,
      lastAddedAt: added.at(-1) ?? null,
      palette,
      tags: [random.pick(MOODS), random.pick(MOODS)].filter(
        (tag, i, all) => all.indexOf(tag) === i,
      ),
      tracks,
    };
  });

  const profiles: ArtistProfile[] = artists
    .slice(0, 30)
    .map((artist, index) => ({
      ...artist,
      imageUrl: coverDataUri(
        [hslToHex(index * 23, 0.5, 0.45), hslToHex(index * 23 + 60, 0.6, 0.6)],
        artist.name.charAt(0),
      ),
    }));

  return {
    playlists,
    artists: profiles,
    rotation: {
      artists: profiles.slice(0, 6),
      tracks: trackPool
        .slice(-8)
        .map(({ id, title, artists: credits, album, url }) => ({
          id,
          title,
          artists: credits,
          album,
          url,
        })),
    },
  };
}
