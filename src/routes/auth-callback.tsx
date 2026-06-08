import { useEffect, useState } from "react";
import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/auth";

export const Route = createFileRoute("/auth-callback")({
  component: AuthCallback,
  head: () => ({ meta: [{ title: "Completing sign in · Orcalis Assess" }] }),
});

type EmailOtpType = "signup" | "magiclink" | "recovery" | "invite" | "email_change";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "error">("working");
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type") as EmailOtpType | null;
        const errorDesc = url.searchParams.get("error_description");

        if (errorDesc) {
          if (!mounted) return;
          setStatus("error");
          setMessage(decodeURIComponent(errorDesc));
          return;
        }

        // Email link flow: exchange token_hash for a session.
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (error) {
            if (!mounted) return;
            setStatus("error");
            setMessage(error.message);
            return;
          }

          // Recovery → user must set a new password.
          if (type === "recovery") {
            navigate({ to: "/reset-password" });
            return;
          }
        }

        // Hash-based OAuth/PKCE flow is handled internally; wait for session.
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          // Briefly wait for the SDK to hydrate.
          await new Promise((r) => setTimeout(r, 300));
        }
        const { data: after } = await supabase.auth.getSession();
        if (!after.session) {
          if (!mounted) return;
          setStatus("error");
          setMessage("We couldn't complete sign in. Please try signing in again.");
          return;
        }

        if (await isAdminUser(after.session.user)) {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } catch {
        if (!mounted) return;
        setStatus("error");
        setMessage("Unexpected error during sign-in.");
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        {status === "working" ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        ) : null}
        <h1 className="mt-3 text-xl font-semibold text-foreground">
          {status === "working" ? "Completing sign in" : "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {status === "error" && (
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-5 text-sm font-medium text-[color:var(--brand-blue)] hover:underline"
          >
            Back to sign in
          </button>
        )}
      </div>
    </main>
  );
}
