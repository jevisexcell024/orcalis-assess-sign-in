import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/create-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
          return Response.json(
            { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment." },
            { status: 503 },
          );
        }

        const body = (await request.json()) as {
          items: { name: string; description?: string; amount_usd_cents: number; metadata?: Record<string, string> }[];
          success_url?: string;
          cancel_url?: string;
          metadata?: Record<string, string>;
        };

        const origin = request.headers.get("origin") ?? "http://localhost:5173";
        const successUrl = body.success_url ?? `${origin}/student/payments?success=1`;
        const cancelUrl  = body.cancel_url  ?? `${origin}/student/payments?canceled=1`;

        const lineItems = body.items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              description: item.description,
              metadata: item.metadata ?? {},
            },
            unit_amount: item.amount_usd_cents,
          },
          quantity: 1,
        }));

        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            ...Object.fromEntries(
              lineItems.flatMap((item, i) => [
                [`line_items[${i}][price_data][currency]`, item.price_data.currency],
                [`line_items[${i}][price_data][product_data][name]`, item.price_data.product_data.name],
                [`line_items[${i}][price_data][product_data][description]`, item.price_data.product_data.description ?? ""],
                [`line_items[${i}][price_data][unit_amount]`, String(item.price_data.unit_amount)],
                [`line_items[${i}][quantity]`, "1"],
              ]),
            ),
            ...(body.metadata
              ? Object.fromEntries(Object.entries(body.metadata).map(([k, v]) => [`metadata[${k}]`, v]))
              : {}),
          }).toString(),
        });

        if (!stripeRes.ok) {
          const err = await stripeRes.json();
          return Response.json({ error: (err as any)?.error?.message ?? "Stripe error" }, { status: 502 });
        }

        const session = await stripeRes.json();
        return Response.json({ session_id: session.id, url: session.url });
      },
    },
  },
});
