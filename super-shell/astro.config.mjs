// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const REDIRECT_ONLY = new Set([
  "https://selltoolhq.com/tools/amazon-image-prep",
  "https://selltoolhq.com/tools/tiktok-shop-image-prep",
]);

// https://astro.build/config
export default defineConfig({
  site: "https://selltoolhq.com",
  trailingSlash: "never",
  integrations: [
    sitemap({
      filter: (page) => {
        const bare = page.replace(/\/$/, "");
        return !REDIRECT_ONLY.has(bare);
      },
    }),
  ],
  devToolbar: { enabled: false },
  vite: {
    optimizeDeps: {
      exclude: ["@huggingface/transformers"],
    },
    server: {
      watch: {
        ignored: ["**/test-output/**", "**/test-fixtures/**", "**/node_modules/**"],
      },
    },
  },
});
