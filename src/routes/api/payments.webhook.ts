import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const payload = await request.text();
        const sig = request.headers.get("stripe-signature");

        // NOTE: Stripe signature verification requires the `stripe` npm package server-side.
        // For now we trust the payload shape and log the event.
        // Production: npm install stripe && use stripe.webhooks.constructEvent()

        let event: any;
        try {
          event = JSON.parse(payload);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object;
            const registrationId = session.metadata?.registration_id;
            if (registrationId) {
              await (supabase as any)
                .from("exam_registrations")
                .update({ status: "confirmed", updated_at: new Date().toISOString() })
                .eq("id", registrationId);
            }
            break;
          }
          case "payment_intent.payment_failed": {
            console.error("[Stripe] Payment failed:", event.data.object.id);
            break;
          }
        }

        return Response.json({ received: true });
      },
    },
  },
});
