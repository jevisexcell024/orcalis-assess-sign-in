import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "UNPUBLISH"
  | "INVITE"  | "REVOKE" | "LOGIN"  | "LOGOUT" | "GRADE"
  | "APPROVE" | "EXPORT" | "ARCHIVE" | "RESTORE" | "SUBMIT";

export type AuditLog = {
  id: string;
  organization_id: string | null;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Write an audit log entry via the SECURITY DEFINER RPC.
 * Falls back silently if the function isn't available yet.
 */
export async function writeAuditLog(opts: {
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  organization_id?: string;
}): Promise<void> {
  try {
    // Try using the DB function first (immutable — no direct INSERT)
    const { error } = await (supabase as any).rpc("create_audit_log", {
      _org_id:        opts.organization_id ?? null,
      _action:        opts.action,
      _resource_type: opts.resource_type,
      _resource_id:   opts.resource_id ?? null,
      _old_values:    opts.old_values  ?? null,
      _new_values:    opts.new_values  ?? null,
    });
    if (error) throw error;
  } catch {
    // Silently swallow — audit logging must never break the main action
  }
}

export async function listAuditLogs(opts?: {
  orgId?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  let q = (supabase as any)
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 500);
  if (opts?.orgId) q = q.eq("organization_id", opts.orgId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AuditLog[];
}
