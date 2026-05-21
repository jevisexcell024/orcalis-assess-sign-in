import { supabase } from "@/integrations/supabase/client";

export const PUBLIC_PATHS = ["/"];
export const ADMIN_ROLES = ["admin", "superadmin", "super_admin"];

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function getUserRole(user?: any) {
  return (
    (user?.app_metadata as any)?.role ||
    (user?.user_metadata as any)?.role ||
    undefined
  );
}

export function isAdminUser(user?: any) {
  const role = getUserRole(user);
  return !!role && ADMIN_ROLES.includes(String(role).toLowerCase());
}

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}
