import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { type Plugin } from "vite";
import { defineConfig } from "vitest/config";

import { site } from "../site.config.ts";

/**
 * GitHub Pages has no rewrite rules: it serves 404.html for unknown paths,
 * so a copy of index.html there lets deep links like /playlist/… load the
 * app, which then routes on the client.
 * @returns The plugin
 */
function spaFallback(): Plugin {
  let outDir = "dist";
  return {
    name: "spa-fallback",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async closeBundle() {
      await copyFile(join(outDir, "index.html"), join(outDir, "404.html"));
    },
  };
}

/**
 * Fills the site identity from `site.config.ts` into index.html
 * (`%SITE_TITLE%`, `%SITE_DESCRIPTION%`) and writes the CNAME file for the
 * custom domain.
 * @returns The plugin
 */
function siteIdentity(): Plugin {
  let outDir = "dist";

  /**
   * Escapes text for an HTML attribute or element.
   * @param text - Plain text
   * @returns The escaped text
   */
  const escape = (text: string): string =>
    text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return {
    name: "site-identity",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    transformIndexHtml(html) {
      return html
        .replaceAll("%SITE_TITLE%", escape(`${site.series} · ${site.domain}`))
        .replaceAll("%SITE_DESCRIPTION%", escape(site.description));
    },
    async writeBundle() {
      await writeFile(join(outDir, "CNAME"), `${site.domain}\n`);
    },
  };
}

/* The app version is the workspace's; the commit comes from CI or the local checkout. */
const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

/**
 * Reads the commit being built.
 * @returns The full SHA, or an empty string outside a git checkout
 */
function currentCommit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

/* Served from the custom domain in site.config.ts: the app lives at the root. */
export default defineConfig({
  base: "/",
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(currentCommit()),
  },
  plugins: [vue(), tailwindcss(), siteIdentity(), spaFallback()],
  build: {
    /*
     * The data chunk holds the whole catalogue; the sample fixtures inline
     * their covers as SVG and push it past the default 500 kB warning.
     */
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        /* The catalogue changes with every sync, the code rarely: separate chunks cache independently. */
        codeSplitting: {
          groups: [
            { name: "data", test: /src[\\/]data[\\/]/ },
            { name: "vendor", test: /node_modules/ },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@site": fileURLToPath(new URL("../site.config.ts", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
