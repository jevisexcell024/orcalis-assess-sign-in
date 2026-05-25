import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/version")({
  server: {
    handlers: {
      GET: async () => {
        const buildTime = process.env.BUILD_TIME || new Date().toISOString();
        const commitHash = process.env.COMMIT_HASH || "unknown";
        const environment = process.env.NODE_ENV || "development";

        const versionInfo = {
          version: "1.0.0",
          environment,
          buildTime,
          commitHash,
          timestamp: new Date().toISOString(),
          features: {
            sentry: !!process.env.VITE_SENTRY_DSN,
            lovable: !!process.env.LOVABLE_API_KEY,
            supabase: !!process.env.VITE_SUPABASE_URL,
          },
        };

        return Response.json(versionInfo);
      },
    },
  },
});
