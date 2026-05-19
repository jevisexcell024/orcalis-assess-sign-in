import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard · Orcalis Assess" }],
  }),
});

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        navigate({ to: "/" });
        return;
      }
      setUser(data.user);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ background: "var(--gradient-primary)" }}
            >
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Orcalis Assess
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-lg">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.email}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          You are signed in to your Orcalis Assess workspace. Your dashboard,
          exam library, and proctoring tools will appear here.
        </p>
      </section>
    </main>
  );
}