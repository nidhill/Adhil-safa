// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Prerender the (single) route to static HTML so the site can be hosted as a
  // pure static frontend — no server at runtime — while keeping SSR'd OG meta tags.
  tanstackStart: {
    server: { entry: "server" },
    prerender: { enabled: true, crawlLinks: true },
    pages: [{ path: "/" }],
  },
});
