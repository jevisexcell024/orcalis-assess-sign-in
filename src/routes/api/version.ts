import { createFileRoute } from "@tanstack/react-router";

// Public version endpoint exposes only the public API version. Commit hash,
// build time, environment, and feature-flag presence are intentionally
// withheld so unauthenticated callers cannot fingerprint the deployment.
export const Route = createFileRoute("/api/version")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({ version: "1.0.0", timestamp: new Date().toISOString() }),
    },
  },
});
