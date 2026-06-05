// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const serverEnv = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    // Pre-warm route files so the TanStack router plugin has the module graph
    // ready before the first browser request arrives (fixes "Crawling result
    // not available" on Windows where the FS scan is slower).
    server: {
      warmup: {
        clientFiles: [
          "./src/routeTree.gen.ts",
          "./src/router.tsx",
          "./src/routes/**/*.tsx",
          "./src/routes/**/*.ts",
        ],
      },
    },
    optimizeDeps: {
      entries: [
        "src/routeTree.gen.ts",
        "src/router.tsx",
        "src/routes/**/*.tsx",
        "src/routes/**/*.ts",
      ],
    },
  },
});
