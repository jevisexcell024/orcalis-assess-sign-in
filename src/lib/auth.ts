import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

const PUBLIC_PATHS = new Set([
  "/",
  "/signup",
  "/admin-login",
  "/forgot-password",
  "/reset-password",
  "/auth-callback",
]);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return PUBLIC_PATHS.has(pathname.slice(0, -1));
  }
  return false;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Failed to load auth session:", error);
    return null;
  }

  return data.session ?? null;
}

/**
 * Returns true if the given user has the super_admin role.
 * Reads from public.user_roles (RLS-scoped to the user's own rows).
 */
export async function isAdminUser(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) {
    console.error("isAdminUser:", error);
    return false;
  }
  return !!data;
}

export async function getUserRoles(user: User | null | undefined): Promise<AppRole[]> {
  if (!user) return [];
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (error) {
    console.error("getUserRoles:", error);
    return [];
  }
  return (data ?? []).map((r) => r.role as AppRole);
}

/**
 * Resolve the landing route for a signed-in user based on their roles.
 * Priority: super_admin → /admin, proctor → /admin/live-monitor,
 * candidate → /student, fallback → /dashboard.
 */
export async function resolveHomeRoute(user: User | null | undefined): Promise<string> {
  const roles = await getUserRoles(user);
  if (roles.includes("super_admin")) return "/admin";
  if (roles.includes("proctor")) return "/admin/live-monitor";
  if (roles.includes("candidate")) return "/student";
  return "/dashboard";
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
