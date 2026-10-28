/*
 * `pnpm auth`: runs the Authorization Code flow with PKCE once and stores the
 * refresh token in `.env`. Needed the first time and whenever the token
 * expires (six months after authorization).
 */
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

import { site } from "../../site.config.ts";
import { loadEnv, writeEnvValue } from "./env.ts";
import { SyncError } from "./errors.ts";
import {
  buildAuthorizeUrl,
  createPkcePair,
  exchangeCode,
} from "./spotify/auth.ts";

/**
 * Renders the small page shown in the browser after the redirect.
 * @param message - Text to show
 * @returns The HTML
 */
function page(message: string): string {
  return `<!doctype html><meta charset="utf-8"><title>${site.series} sync</title><body style="font:16px system-ui;padding:40px"><p>${message}</p></body>`;
}

try {
  const env = await loadEnv();
  const redirect = new URL(env.SPOTIFY_REDIRECT_URI);
  if (
    redirect.protocol !== "http:" ||
    !["127.0.0.1", "[::1]", "localhost"].includes(redirect.hostname)
  ) {
    throw new SyncError(
      "SPOTIFY_REDIRECT_URI must be a loopback address, e.g. http://127.0.0.1:8888/callback.",
    );
  }
  const port = Number(redirect.port || 80);
  const { verifier, challenge } = createPkcePair();
  const state = randomBytes(16).toString("hex");

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", redirect.origin);
      if (url.pathname !== redirect.pathname) {
        response.writeHead(404).end();
        return;
      }
      const error = url.searchParams.get("error");
      const received = url.searchParams.get("code");
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      if (error || !received || url.searchParams.get("state") !== state) {
        response.end(page("Authorization failed. Go back to the terminal."));
        server.close();
        reject(
          new SyncError(
            `Authorization denied or invalid${error ? `: ${error}` : ""}.`,
          ),
        );
        return;
      }
      response.end(
        page("Done! You can close this tab and go back to the terminal."),
      );
      server.close();
      resolve(received);
    });
    server.on("error", (error) =>
      reject(
        new SyncError(`Cannot listen on ${redirect.host}: ${error.message}`),
      ),
    );
    server.listen(port, redirect.hostname.replace(/^\[|\]$/g, ""), () => {
      console.log(
        "Open this link in your browser and authorize the app (use the Premium account that owns the app):\n",
      );
      console.log(`  ${buildAuthorizeUrl(env, challenge, state)}\n`);
      console.log(`Waiting for the redirect on ${redirect.href} …`);
    });
  });

  const grant = await exchangeCode(env, code, verifier);
  if (!grant.refreshToken)
    throw new SyncError("Spotify did not return a refresh token.");
  await writeEnvValue("SPOTIFY_REFRESH_TOKEN", grant.refreshToken);
  console.log(
    "\n✓ Refresh token saved to .env (it expires in 6 months). You can now run `pnpm sync`.",
  );
} catch (error) {
  if (error instanceof SyncError) {
    console.error(`\n✗ ${error.message}`);
    process.exit(1);
  }
  throw error;
}
