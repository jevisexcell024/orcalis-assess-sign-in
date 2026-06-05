import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, Download, Shield, Clock, ChevronDown } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/audit-logs")({
  component: AuditLogsPage,
  head: () => ({ meta: [{ title: "Audit Logs · Orcalis Assess" }] }),
});

type AuditLog = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
};

async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await (supabase as any)
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as AuditLog[];
}

const ACTION_CLS: Record<string, string> = {
  CREATE:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  UPDATE:  "bg-sky-50     text-sky-700     ring-sky-200",
  DELETE:  "bg-rose-50    text-rose-700    ring-rose-200",
  PUBLISH: "bg-violet-50  text-violet-700  ring-violet-200",
  INVITE:  "bg-amber-50   text-amber-700   ring-amber-200",
  LOGIN:   "bg-slate-100  text-slate-600   ring-slate-200",
  REVOKE:  "bg-orange-50  text-orange-700  ring-orange-200",
};

function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: fetchAuditLogs,
    refetchInterval: 60_000,
  });

  const filtered = useMemo(() => logs.filter((l: any) => {
    const matchSearch = !search || (l.actor_email ?? "").includes(search) || l.resource_type.includes(search) || (l.resource_id ?? "").includes(search);
    const matchAction = actionFilter === "all" || l.action === actionFilter;
    return matchSearch && matchAction;
  }), [logs, search, actionFilter]);

  const actions = Array.from(new Set(logs.map((l: any) => l.action)));

  return (
    <AdminShell
      title="Audit Logs"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Audit Logs" }]}
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="h-4 w-4" />
            Security Notice
          </div>
          <p className="mt-1 text-xs">
            Audit logs record all critical actions taken on the platform. Logs are immutable and retained for 7 years for compliance (GDPR, SOC 2, ISO 27001).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by actor, resource type, or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9" />
          </div>
          <div className="relative">
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer">
              <option value="all">All Actions</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" /> Export CSV</Button>
        </div>

        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Resource</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 text-right font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">No log entries found.</td></tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          {new Date(log.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{log.actor_email}</td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1", ACTION_CLS[log.action] ?? "bg-muted text-muted-foreground")}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium capitalize">{log.resource_type}</p>
                        {log.resource_id && <p className="font-mono text-[11px] text-muted-foreground">{log.resource_id}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip_address}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted">
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Showing {filtered.length} of {logs.length} log entries
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
