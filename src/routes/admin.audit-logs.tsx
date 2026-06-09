import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Search, Download, Shield, Clock, ChevronDown, X,
  Eye, FileText, User, Globe,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/csv";
import { toast } from "sonner";
import { listAuditLogs, type AuditLog } from "@/lib/audit";

export const Route = createFileRoute("/admin/audit-logs")({
  component: AuditLogsPage,
  head: () => ({ meta: [{ title: "Audit Logs · Orcalis Assess" }] }),
});

const NAVY = "oklch(0.385 0.12 247)";

const ACTION_STYLE: Record<string, string> = {
  CREATE:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  UPDATE:   "bg-sky-50     text-sky-700     ring-1 ring-sky-200",
  DELETE:   "bg-rose-50    text-rose-700    ring-1 ring-rose-200",
  PUBLISH:  "bg-violet-50  text-violet-700  ring-1 ring-violet-200",
  UNPUBLISH:"bg-orange-50  text-orange-700  ring-1 ring-orange-200",
  INVITE:   "bg-amber-50   text-amber-700   ring-1 ring-amber-200",
  LOGIN:    "bg-slate-100  text-slate-600   ring-1 ring-slate-200",
  REVOKE:   "bg-rose-100   text-rose-700    ring-1 ring-rose-200",
  GRADE:    "bg-indigo-50  text-indigo-700  ring-1 ring-indigo-200",
  APPROVE:  "bg-teal-50    text-teal-700    ring-1 ring-teal-200",
  EXPORT:   "bg-cyan-50    text-cyan-700    ring-1 ring-cyan-200",
  ARCHIVE:  "bg-gray-100   text-gray-600    ring-1 ring-gray-200",
  SUBMIT:   "bg-purple-50  text-purple-700  ring-1 ring-purple-200",
};

const RESOURCE_ICON: Record<string, any> = {
  exam:         FileText,
  result:       FileText,
  certificate:  FileText,
  user:         User,
  student:      User,
  invitation:   User,
  organization: Globe,
};

function InspectModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-base font-semibold">Audit Log Entry</h2>
              <p className="text-xs text-muted-foreground font-mono">{log.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Core fields */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Timestamp",     value: new Date(log.created_at).toLocaleString() },
              { label: "Actor Email",   value: log.actor_email ?? "—" },
              { label: "Actor ID",      value: log.actor_id ?? "—" },
              { label: "Action",        value: log.action },
              { label: "Resource Type", value: log.resource_type },
              { label: "Resource ID",   value: log.resource_id ?? "—" },
              { label: "IP Address",    value: log.ip_address ?? "—" },
              { label: "User Agent",    value: log.user_agent ?? "—" },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{f.label}</p>
                <p className="font-mono text-sm break-all">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Before / After */}
          {(log.old_values || log.new_values) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Before</p>
                <pre className="rounded-xl border border-border bg-muted/30 p-3 text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                  {log.old_values ? JSON.stringify(log.old_values, null, 2) : "—"}
                </pre>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">After</p>
                <pre className="rounded-xl border border-border bg-muted/30 p-3 text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                  {log.new_values ? JSON.stringify(log.new_values, null, 2) : "—"}
                </pre>
              </div>
            </div>
          )}

          {log.metadata && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Metadata</p>
              <pre className="rounded-xl border border-border bg-muted/30 p-3 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function AuditLogsPage() {
  const [search, setSearch]         = useState("");
  const [actionFilter, setAction]   = useState("all");
  const [resourceFilter, setResource] = useState("all");
  const [inspecting, setInspecting] = useState<AuditLog | null>(null);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => listAuditLogs({ limit: 500 }),
    refetchInterval: 60_000,
  });

  const actions   = useMemo(() => Array.from(new Set(logs.map((l) => l.action))).sort(), [logs]);
  const resources = useMemo(() => Array.from(new Set(logs.map((l) => l.resource_type))).sort(), [logs]);

  const filtered = useMemo(() => logs.filter((l) => {
    const matchSearch = !search || [l.actor_email, l.resource_type, l.resource_id, l.action]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchAction   = actionFilter === "all"   || l.action === actionFilter;
    const matchResource = resourceFilter === "all" || l.resource_type === resourceFilter;
    return matchSearch && matchAction && matchResource;
  }), [logs, search, actionFilter, resourceFilter]);

  const handleExport = () => {
    exportToCSV(
      `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered as any[],
      [
        { key: "created_at",    header: "Timestamp" },
        { key: "actor_email",   header: "Actor" },
        { key: "action",        header: "Action" },
        { key: "resource_type", header: "Resource Type" },
        { key: "resource_id",   header: "Resource ID" },
        { key: "ip_address",    header: "IP Address" },
      ]
    );
    toast.success(`Exported ${filtered.length} log entries`);
  };

  return (
    <AdminShell
      title="Audit Logs"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Audit Logs" }]}
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-5">

        {/* Compliance notice */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Shield className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Immutable Security Audit Trail</p>
            <p className="text-xs mt-0.5">
              All logs are written via a SECURITY DEFINER database function. Direct INSERT/UPDATE/DELETE is blocked.
              Retained 7 years for GDPR, SOC 2, and ISO 27001 compliance.
            </p>
          </div>
        </div>

        {/* Summary counters */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Entries",  value: logs.length },
            { label: "Auth Events",    value: logs.filter((l) => ["LOGIN","LOGOUT"].includes(l.action)).length },
            { label: "Write Actions",  value: logs.filter((l) => ["CREATE","UPDATE","DELETE"].includes(l.action)).length },
            { label: "Admin Actions",  value: logs.filter((l) => ["PUBLISH","APPROVE","REVOKE","ARCHIVE"].includes(l.action)).length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by actor, resource, or ID…" value={search}
              onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9" />
          </div>
          <div className="relative">
            <select value={actionFilter} onChange={(e) => setAction(e.target.value)}
              className="h-9 rounded-md border border-border bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer">
              <option value="all">All Actions</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="relative">
            <select value={resourceFilter} onChange={(e) => setResource(e.target.value)}
              className="h-9 rounded-md border border-border bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer">
              <option value="all">All Resources</option>
              {resources.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
            <Clock className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Resource</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 text-right font-medium">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">Loading audit trail…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center">
                    <Shield className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No log entries match your filters.</p>
                  </td></tr>
                ) : (
                  filtered.map((log) => {
                    const Icon = RESOURCE_ICON[log.resource_type] ?? FileText;
                    return (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 shrink-0" />
                            {new Date(log.created_at).toLocaleString(undefined, {
                              month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit", second: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{log.actor_email ?? "System"}</p>
                          {log.actor_id && (
                            <p className="font-mono text-[11px] text-muted-foreground">{log.actor_id.slice(0,8)}…</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            ACTION_STYLE[log.action] ?? "bg-muted text-muted-foreground ring-1 ring-border")}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium capitalize text-sm">{log.resource_type}</p>
                              {log.resource_id && (
                                <p className="font-mono text-[11px] text-muted-foreground">{log.resource_id.slice(0,8)}…</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {log.ip_address ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" className="gap-1.5 h-7 px-2"
                            onClick={() => setInspecting(log)}>
                            <Eye className="h-3.5 w-3.5" /> Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filtered.length} of {logs.length} entries</span>
            <span>Updated every 60s</span>
          </div>
        </div>
      </div>

      {inspecting && <InspectModal log={inspecting} onClose={() => setInspecting(null)} />}
    </AdminShell>
  );
}
