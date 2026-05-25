import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const startTime = Date.now();
        const response: {
          status: "healthy" | "degraded" | "unhealthy";
          timestamp: string;
          uptime?: number;
          version: string;
          checks: Record<string, { status: "ok" | "error"; duration?: number; message?: string }>;
          responseTime: number;
        } = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          checks: {},
          responseTime: 0,
        };

        try {
          // Check database connection
          const dbCheckStart = Date.now();
          const supabaseUrl = process.env.VITE_SUPABASE_URL;
          const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

          if (supabaseUrl && supabaseKey) {
            try {
              const supabase = createClient(supabaseUrl, supabaseKey);
              const { error } = await supabase.from("exams").select("id").limit(1);

              const dbCheckDuration = Date.now() - dbCheckStart;
              if (error) {
                response.checks.database = {
                  status: "error",
                  duration: dbCheckDuration,
                  message: error.message,
                };
                response.status = "degraded";
              } else {
                response.checks.database = {
                  status: "ok",
                  duration: dbCheckDuration,
                };
              }
            } catch (err) {
              const dbCheckDuration = Date.now() - dbCheckStart;
              response.checks.database = {
                status: "error",
                duration: dbCheckDuration,
                message: err instanceof Error ? err.message : "Unknown error",
              };
              response.status = "degraded";
            }
          } else {
            response.checks.database = {
              status: "error",
              message: "Database credentials not configured",
            };
            response.status = "degraded";
          }

          // Check environment configuration
          const configCheck = {
            supabaseUrl: !!process.env.VITE_SUPABASE_URL,
            supabaseKey: !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          };

          if (!configCheck.supabaseUrl || !configCheck.supabaseKey) {
            response.checks.configuration = {
              status: "error",
              message: "Missing critical environment variables",
            };
            response.status = "unhealthy";
          } else {
            response.checks.configuration = {
              status: "ok",
            };
          }

          // Check memory usage (basic)
          if (typeof process !== "undefined" && process.memoryUsage) {
            const memUsage = process.memoryUsage();
            const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

            if (heapUsedPercent > 90) {
              response.status = "degraded";
              response.checks.memory = {
                status: "error",
                message: `Heap usage at ${heapUsedPercent.toFixed(1)}%`,
              };
            } else {
              response.checks.memory = {
                status: "ok",
              };
            }
          }
        } catch (error) {
          response.status = "unhealthy";
          response.checks.system = {
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }

        response.responseTime = Date.now() - startTime;

        return Response.json(response, {
          status: response.status === "healthy" ? 200 : response.status === "degraded" ? 503 : 503,
        });
      },
    },
  },
});
