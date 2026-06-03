import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/payments/invoices")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // In production, look up the Stripe customer ID from the user's profile
        // and call the Stripe API to list their invoices.
        // For now, return a structured mock to keep the UI working.
        return Response.json({
          invoices: [],
          message: "Connect a Stripe customer ID to this endpoint to load real invoices.",
        });
      },
    },
  },
});
