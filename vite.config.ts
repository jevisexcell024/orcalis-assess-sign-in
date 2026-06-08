import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const serverEnv = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      preTransformRequests: false,
    },
    optimizeDeps: {
      entries: [
        "src/main.tsx",
        "src/router.tsx",
        "src/routeTree.gen.ts",
      ],
    },
  },
});
