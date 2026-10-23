import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

/*
 * Served from the custom domain music.pivi.dev, so the app lives at the root.
 * The design-lab preview build overrides it with a relative base.
 */
export default defineConfig(({ mode }) => ({
  base: mode === "lab" ? "./" : "/",
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
}));
