import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import postcss from "./postcss.config";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  css: { postcss },
  plugins: [svelte()],
});
