// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://minitoolhq.com",
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  vite: {
    server: {
      watch: {
        ignored: ["**/test-output/**", "**/test-fixtures/**", "**/node_modules/**"],
      },
    },
  },
});
