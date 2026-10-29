import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

// GitHub Pages project site: https://burkifa23.github.io/abc/
// ponytail: drop `base` if you move to a custom domain.
export default defineConfig({
  site: "https://burkifa23.github.io",
  base: "/abc/",
  integrations: [mdx()],
});
