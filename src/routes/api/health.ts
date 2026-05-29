import { createFileRoute } from "@tanstack/react-router";

// Public health endpoint: returns only a minimal liveness signal so we do not
// leak database error messages, memory stats, or feature-flag presence to
// unauthenticated callers.
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => Response.json({ status: "ok" }),
    },
  },
});
