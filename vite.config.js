import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Use relative base so the built index.html loads assets relatively.
  // This is portable and works when serving dist from any root.
  base: "/food-tracking/",

  // public/ will be copied to dist/
  publicDir: "public",

  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },

  css: {
    devSourcemap: true,
  },

  server: {
    port: 5173,
    open: false,
  },
});
