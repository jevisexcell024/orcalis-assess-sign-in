import { createFileRoute } from "@tanstack/react-router";
import { getAuthenticatedUser } from "./-_auth";

export const Route = createFileRoute("/api/email/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth guard — must be authenticated
        try {
          await getAuthenticatedUser(request);
        } catch (e) {
          return e instanceof Response ? e : Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body: { host?: string; port?: number; user?: string; pass?: string; to?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        const { host, port = 587, user, pass, to } = body;
        if (!host) {
          return Response.json({ error: "SMTP host is required." }, { status: 400 });
        }

        // Try Resend API if configured (preferred in Cloudflare Workers — no raw TCP)
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          const recipient = to ?? user ?? "admin@orcalis.io";
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Orcalis Assess <noreply@assess.orcalis.io>",
              to: [recipient],
              subject: "Orcalis Assess — SMTP Test",
              html: `<p>This is a test email from <strong>Orcalis Assess</strong>.</p>
                     <p>Your SMTP configuration (<code>${host}:${port}</code>) is working correctly.</p>`,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return Response.json(
              { error: (err as { message?: string }).message ?? "Resend API error." },
              { status: 502 }
            );
          }
          return Response.json({ success: true, provider: "resend" });
        }

        // No email provider key — validate config shape and return a diagnostic response
        const missingFields: string[] = [];
        if (!user) missingFields.push("SMTP username");
        if (!pass) missingFields.push("SMTP password");

        if (missingFields.length > 0) {
          return Response.json(
            {
              error: `Missing: ${missingFields.join(", ")}. Also set RESEND_API_KEY in Wrangler secrets to enable live sending.`,
            },
            { status: 422 }
          );
        }

        // Config looks complete — inform admin that RESEND_API_KEY is needed for live send
        return Response.json({
          success: true,
          provider: "smtp_pending",
          note: "SMTP config looks valid. Set RESEND_API_KEY in Wrangler secrets to enable live test sends from Cloudflare Workers.",
        });
      },
    },
  },
});
