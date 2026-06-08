import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface CurrentUser {
  user: User | null;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  email: string;
  loading: boolean;
}

function getDisplayName(user: User | null): string {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  return (
    meta.full_name ||
    meta.name ||
    meta.display_name ||
    (user.email ? user.email.split("@")[0].replace(/[._-]/g, " ") : "User")
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const email = user?.email ?? "";

  return { user, displayName, initials, avatarUrl, email, loading };
}
