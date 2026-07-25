// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  vite: {
    server: {
      watch: {
        ignored: ["**/test-output/**", "**/test-fixtures/**", "**/node_modules/**"],
      },
    },
  },
});
