/** Message shown whenever the stored authorization can no longer be used. */
export const REAUTH_HINT =
  "The Spotify refresh token is no longer valid (it expires 6 months after authorization, or it was revoked). Run `pnpm auth` again, then `pnpm sync`.";

/** A failure the user can fix, reported without a stack trace. */
export class SyncError extends Error {
  /**
   * Creates the error.
   * @param message - What went wrong and how to fix it
   * @param options - Standard error options, e.g. the cause
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SyncError";
  }
}

/** The refresh token expired or was revoked: `pnpm auth` must run again. */
export class ReauthorizationRequiredError extends SyncError {
  /**
   * Creates the error with the standard hint.
   * @param detail - Spotify's own error description, if any
   */
  constructor(detail?: string) {
    super(detail ? `${REAUTH_HINT}\nSpotify says: ${detail}` : REAUTH_HINT);
    this.name = "ReauthorizationRequiredError";
  }
}
