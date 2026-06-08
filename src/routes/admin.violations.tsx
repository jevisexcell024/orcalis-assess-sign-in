import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, ShieldAlert, Eye, Check, ChevronDown } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/violations")({
  component: ViolationsPage,
  head: () => ({ meta: [{ title: "AI Violations · Orcalis Assess" }] }),
});

async function listViolations() {
  const { data, error } = await supabase
    .from("proctoring_events")
    .select(`
      id, event_type, severity, message, created_at,
      exam_registrations:registration_id (
        id, candidate_id,
        exams ( title )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return data ?? [];
}

const SEV_META: Record<string, { cls: string; label: string }> = {
  high:    { cls: "bg-rose-50   text-rose-700   ring-rose-200",   label: "High"    },
  warning: { cls: "bg-amber-50  text-amber-700  ring-amber-200",  label: "Warning" },
  info:    { cls: "bg-sky-50    text-sky-700    ring-sky-200",    label: "Info"    },
};

function ViolationsPage() {
  const [sevFilter, setSevFilter] = useState("all");
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin", "violations"],
    queryFn: listViolations,
    refetchInterval: 15_000,
  });

  const filtered = events.filter((e) => sevFilter === "all" || e.severity === sevFilter);
  const high = events.filter((e) => e.severity === "high").length;
  const warns = events.filter((e) => e.severity === "warning").length;

  const handleClear = () => {
    toast.success("Selected violations marked as cleared.");
  };

  return (
    <AdminShell
      title="AI Violations"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "AI Violations" }]}
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Events",   value: events.length, cls: "text-foreground"  },
            { label: "High Severity",  value: high,          cls: "text-rose-700"   },
            { label: "Warnings",       value: warns,         cls: "text-amber-700"  },
            { label: "Info",           value: events.length - high - warns, cls: "text-sky-700" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-1">
            {["all","high","warning","info"].map((s) => (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition capitalize",
                  sevFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleClear}>
              <Check className="h-4 w-4" /> Mark Cleared
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Event Type</th>
                  <th className="px-4 py-3 font-medium">Exam</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">Loading violations…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No violations found. All sessions are clean.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => {
                    const sev = SEV_META[e.severity] ?? SEV_META.info;
                    return (
                      <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", sev.cls)}>
                            <AlertTriangle className="h-3 w-3" />
                            {sev.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium capitalize">{e.event_type.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-sm">{(e as any).exam_registrations?.exams?.title ?? "–"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{e.message ?? "–"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted">
                            <Eye className="h-3 w-3" /> Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              Showing {filtered.length} of {events.length} events · Auto-refreshes every 15s
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
