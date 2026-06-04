/**
 * Shared auth helper for server-side API routes.
 * Returns the authenticated user or throws a 401 Response.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (!token) {
    throw Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url  = process.env.VITE_SUPABASE_URL  ?? process.env.SUPABASE_URL ?? "";
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";

  const client = createClient<Database>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await client.auth.getUser(token);

  if (error || !user) {
    throw Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user, client };
}
