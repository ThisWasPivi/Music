/*
 * `pnpm auth`: runs the Authorization Code flow with PKCE once and stores the
 * refresh token in `.env`. Needed the first time and whenever the token
 * expires (six months after authorization).
 */
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

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
  return `<!doctype html><meta charset="utf-8"><title>Pivəəkly sync</title><body style="font:16px system-ui;padding:40px"><p>${message}</p></body>`;
}

try {
  const env = await loadEnv();
  const redirect = new URL(env.SPOTIFY_REDIRECT_URI);
  if (
    redirect.protocol !== "http:" ||
    !["127.0.0.1", "[::1]", "localhost"].includes(redirect.hostname)
  ) {
    throw new SyncError(
      "SPOTIFY_REDIRECT_URI deve essere un indirizzo di loopback, es. http://127.0.0.1:8888/callback.",
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
        response.end(page("Autorizzazione non riuscita. Torna al terminale."));
        server.close();
        reject(
          new SyncError(
            `Autorizzazione rifiutata o non valida${error ? `: ${error}` : ""}.`,
          ),
        );
        return;
      }
      response.end(
        page("Fatto! Puoi chiudere questa scheda e tornare al terminale."),
      );
      server.close();
      resolve(received);
    });
    server.on("error", (error) =>
      reject(
        new SyncError(
          `Impossibile ascoltare su ${redirect.host}: ${error.message}`,
        ),
      ),
    );
    server.listen(port, redirect.hostname.replace(/^\[|\]$/g, ""), () => {
      console.log(
        "Apri questo link nel browser e autorizza l'app (serve l'account Premium owner dell'app):\n",
      );
      console.log(`  ${buildAuthorizeUrl(env, challenge, state)}\n`);
      console.log(`In attesa del redirect su ${redirect.href} …`);
    });
  });

  const grant = await exchangeCode(env, code, verifier);
  if (!grant.refreshToken)
    throw new SyncError("Spotify non ha restituito un refresh token.");
  await writeEnvValue("SPOTIFY_REFRESH_TOKEN", grant.refreshToken);
  console.log(
    "\n✓ Refresh token salvato in .env (scade tra 6 mesi). Ora puoi lanciare `pnpm sync`.",
  );
} catch (error) {
  if (error instanceof SyncError) {
    console.error(`\n✗ ${error.message}`);
    process.exit(1);
  }
  throw error;
}
