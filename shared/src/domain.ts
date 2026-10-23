/**
 * Domain model published by the sync and read by the web app.
 *
 * Nothing here knows about the Spotify Web API: the sync's adapter maps the
 * API's DTOs onto these shapes, and the app only ever sees them.
 */

/**
 * An artist as it appears on a track credit.
 * @property id - Stable Spotify artist id
 * @property name - Display name
 * @property url - Public Spotify page
 */
export interface ArtistRef {
  id: string;
  name: string;
  url: string;
}

/**
 * The album a track belongs to.
 * @property id - Stable Spotify album id
 * @property name - Album title
 * @property url - Public Spotify page
 * @property imageUrl - Smallest cover that still reads at thumbnail size, if any
 */
export interface AlbumRef {
  id: string;
  name: string;
  url: string;
  imageUrl: string | null;
}

/**
 * One entry of a playlist.
 * @property id - Stable Spotify track id
 * @property title - Track title
 * @property artists - Credited artists, in credit order
 * @property album - Album the track was released on
 * @property releaseYear - Year of the album release, when Spotify knows it
 * @property durationMs - Track length in milliseconds
 * @property explicit - Whether Spotify flags the lyrics as explicit
 * @property addedAt - ISO timestamp of when the track was added to the playlist
 * @property url - Public Spotify page
 */
export interface Track {
  id: string;
  title: string;
  artists: ArtistRef[];
  album: AlbumRef;
  releaseYear: number | null;
  durationMs: number;
  explicit: boolean;
  addedAt: string;
  url: string;
}

/**
 * A published Pivəəkly issue.
 * @property id - Stable Spotify playlist id
 * @property name - Playlist name as shown on Spotify
 * @property number - Issue number parsed from the name, or null when absent
 * @property description - Plain-text playlist description
 * @property coverUrl - Largest cover image, if the playlist has one
 * @property url - Public Spotify page
 * @property trackCount - Number of tracks
 * @property durationMs - Sum of the track lengths
 * @property firstAddedAt - Earliest track `added_at`, used as the release date
 * @property lastAddedAt - Latest track `added_at`
 * @property palette - Dominant cover colours as `#rrggbb`, most dominant first
 * @property tags - Optional moods configured for this playlist
 * @property tracks - Tracks in playlist order
 */
export interface Playlist {
  id: string;
  name: string;
  number: number | null;
  description: string;
  coverUrl: string | null;
  url: string;
  trackCount: number;
  durationMs: number;
  firstAddedAt: string | null;
  lastAddedAt: string | null;
  palette: string[];
  tags: string[];
  tracks: Track[];
}

/**
 * Extra details fetched for the most frequent artists only.
 * @property id - Stable Spotify artist id
 * @property name - Display name
 * @property url - Public Spotify page
 * @property imageUrl - Artist picture, if Spotify has one
 */
export interface ArtistProfile {
  id: string;
  name: string;
  url: string;
  imageUrl: string | null;
}

/**
 * The account's current listening, for the "in rotation" section.
 * @property artists - Top artists over the short-term window
 * @property tracks - Top tracks over the short-term window
 */
export interface Rotation {
  artists: ArtistProfile[];
  tracks: Pick<Track, "id" | "title" | "artists" | "album" | "url">[];
}

/**
 * Metadata about the last sync.
 * @property generatedAt - ISO timestamp of the sync run
 * @property source - Whether the data came from Spotify or the sample fixtures
 */
export interface CatalogMeta {
  generatedAt: string;
  source: "spotify" | "fixtures";
}
