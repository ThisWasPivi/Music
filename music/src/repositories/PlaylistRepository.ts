import type {
  ArtistProfile,
  CatalogMeta,
  Playlist,
  Rotation,
} from "@music/shared";

import artistsData from "@/data/artists.json";
import metaData from "@/data/meta.json";
import playlistsData from "@/data/playlists.json";
import rotationData from "@/data/rotation.json";

/**
 * Read access to the published catalogue.
 *
 * The JSON files are written by the sync and bundled at build time; this is
 * the only module allowed to import them, so the UI never depends on the
 * file layout.
 */
export class PlaylistRepository {
  readonly #playlists: readonly Playlist[];
  readonly #artists: readonly ArtistProfile[];
  readonly #rotation: Rotation;
  readonly #meta: CatalogMeta;

  /**
   * Creates a repository over an in-memory catalogue.
   * @param playlists - Published playlists
   * @param artists - Profiles for the top artists
   * @param rotation - Current listening
   * @param meta - Sync metadata
   */
  constructor(
    playlists: readonly Playlist[],
    artists: readonly ArtistProfile[],
    rotation: Rotation,
    meta: CatalogMeta,
  ) {
    this.#playlists = playlists;
    this.#artists = artists;
    this.#rotation = rotation;
    this.#meta = meta;
  }

  /**
   * Lists every published playlist, in the order the sync wrote them.
   * @returns The playlists
   */
  all(): readonly Playlist[] {
    return this.#playlists;
  }

  /**
   * Finds a playlist by its Spotify id.
   * @param id - The playlist id
   * @returns The playlist, or undefined when it is not published
   */
  byId(id: string): Playlist | undefined {
    return this.#playlists.find((playlist) => playlist.id === id);
  }

  /**
   * Finds a playlist by its issue number.
   * @param issue - The issue number
   * @returns The playlist, or undefined when that issue does not exist
   */
  byNumber(issue: number): Playlist | undefined {
    return this.#playlists.find((playlist) => playlist.number === issue);
  }

  /**
   * Lists the profiles of the top artists.
   * @returns The artist profiles
   */
  artists(): readonly ArtistProfile[] {
    return this.#artists;
  }

  /**
   * Returns the current-listening data.
   * @returns The rotation, possibly with empty lists
   */
  rotation(): Rotation {
    return this.#rotation;
  }

  /**
   * Returns the sync metadata.
   * @returns When and from where the data was produced
   */
  meta(): CatalogMeta {
    return this.#meta;
  }
}

/** The repository over the bundled data. */
export const playlistRepository = new PlaylistRepository(
  playlistsData as Playlist[],
  artistsData as ArtistProfile[],
  rotationData as Rotation,
  metaData as CatalogMeta,
);
