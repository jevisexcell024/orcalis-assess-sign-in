import { useEffect, useState } from "react";
import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth-callback")({
  component: AuthCallback,
  head: () => ({ meta: [{ title: "Signing in..." }] }),
});

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    let mounted = true;
    let attempts = 0;

    const check = async () => {
      try {
        // Try to read the session from the client
        const { data, error } = await supabase.auth.getSession();
        if (error) console.debug("auth.getSession error:", error.message);

        if (data?.session) {
          if (!mounted) return;
          navigate({ to: "/dashboard" });
          return;
        }

        // If there is no session yet, poll a few times while the SDK processes the URL
        attempts += 1;
        if (attempts < 20) {
          setTimeout(check, 300);
        } else {
          if (!mounted) return;
          setMessage("Sign in complete but no active session found. Redirecting to home...");
          setTimeout(() => navigate({ to: "/" }), 800);
        }
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setMessage("Unexpected error during sign-in. Redirecting to home...");
        setTimeout(() => navigate({ to: "/" }), 800);
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Completing sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
