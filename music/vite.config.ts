import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { type Plugin } from "vite";
import { defineConfig } from "vitest/config";

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

/* Served from the custom domain music.pivi.dev (see public/CNAME): the app lives at the root. */
export default defineConfig({
  base: "/",
  plugins: [vue(), tailwindcss(), spaFallback()],
  build: {
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
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
