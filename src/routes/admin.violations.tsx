import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, ShieldAlert, Eye, Check, X, ChevronRight } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/violations")({
  component: ViolationsPage,
  head: () => ({ meta: [{ title: "AI Violations · Orcalis Assess" }] }),
});

const NAVY = "oklch(0.385 0.12 247)";

async function listViolations() {
  const { data, error } = await supabase
    .from("proctoring_events")
    .select(`
      id, event_type, severity, message, created_at,
      exam_registrations:registration_id (
        id, candidate_id,
        profiles:candidate_id ( email, full_name ),
        exams:exam_id ( title )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return data ?? [];
}

async function deleteViolations(ids: string[]) {
  const { error } = await supabase
    .from("proctoring_events")
    .delete()
    .in("id", ids);
  if (error) throw error;
}

type ViolationRow = Awaited<ReturnType<typeof listViolations>>[number];

const SEV_META: Record<string, { cls: string; label: string }> = {
  high:    { cls: "bg-rose-50   text-rose-700   ring-rose-200",   label: "High"    },
  warning: { cls: "bg-amber-50  text-amber-700  ring-amber-200",  label: "Warning" },
  info:    { cls: "bg-sky-50    text-sky-700    ring-sky-200",    label: "Info"    },
};

function DetailPanel({ event, onClose }: { event: ViolationRow; onClose: () => void }) {
  const reg = event.exam_registrations as any;
  const profile = reg?.profiles;
  const exam = reg?.exams;
  const sev = SEV_META[event.severity] ?? SEV_META.info;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-md border-l border-border bg-background shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Violation Detail</h3>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", sev.cls)}>
                <AlertTriangle className="h-3 w-3" />
                {sev.label} Severity
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Event Type</p>
              <p className="text-sm font-medium capitalize">{event.event_type.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Message</p>
              <p className="text-sm">{event.message ?? "No message recorded"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Timestamp</p>
              <p className="text-sm">{new Date(event.created_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exam</p>
            <p className="text-sm font-medium">{exam?.title ?? "–"}</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Candidate</p>
            <div>
              <p className="text-sm font-medium">{profile?.full_name ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email ?? "–"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViolationsPage() {
  const [sevFilter, setSevFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState<ViolationRow | null>(null);
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin", "violations"],
    queryFn: listViolations,
    refetchInterval: 15_000,
  });

  const clearMutation = useMutation({
    mutationFn: deleteViolations,
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ["admin", "violations"] });
      setSelected(new Set());
      toast.success(`${ids.length} violation${ids.length > 1 ? "s" : ""} cleared.`);
    },
    onError: () => toast.error("Failed to clear violations."),
  });

  const filtered = events.filter((e) => sevFilter === "all" || e.severity === sevFilter);
  const high = events.filter((e) => e.severity === "high").length;
  const warns = events.filter((e) => e.severity === "warning").length;

  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => { const next = new Set(prev); filtered.forEach((e) => next.delete(e.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); filtered.forEach((e) => next.add(e.id)); return next; });
    }
  };
  const toggle = (id: string) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const selectedInView = filtered.filter((e) => selected.has(e.id)).map((e) => e.id);

  return (
    <AdminShell
      title="AI Violations"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "AI Violations" }]}
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Events",  value: events.length,                         cls: "text-foreground" },
            { label: "High Severity", value: high,                                   cls: "text-rose-700"   },
            { label: "Warnings",      value: warns,                                  cls: "text-amber-700"  },
            { label: "Info",          value: events.length - high - warns,           cls: "text-sky-700"    },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-1">
            {["all", "high", "warning", "info"].map((s) => (
              <button
                key={s}
                onClick={() => { setSevFilter(s); setSelected(new Set()); }}
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
            {selectedInView.length > 0 && (
              <span className="text-xs text-muted-foreground">{selectedInView.length} selected</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={selectedInView.length === 0 || clearMutation.isPending}
              onClick={() => {
                if (selectedInView.length === 0) return;
                clearMutation.mutate(selectedInView);
              }}
            >
              <Check className="h-4 w-4" />
              {clearMutation.isPending ? "Clearing…" : "Mark Cleared"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Event Type</th>
                  <th className="px-4 py-3 font-medium">Exam</th>
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">Loading violations…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No violations found. All sessions are clean.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => {
                    const sev = SEV_META[e.severity] ?? SEV_META.info;
                    const reg = e.exam_registrations as any;
                    const candidateName = reg?.profiles?.full_name ?? reg?.profiles?.email ?? "–";
                    return (
                      <tr
                        key={e.id}
                        className={cn("transition-colors", selected.has(e.id) ? "bg-muted/40" : "hover:bg-muted/20")}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(e.id)}
                            onChange={() => toggle(e.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", sev.cls)}>
                            <AlertTriangle className="h-3 w-3" />
                            {sev.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium capitalize">{e.event_type.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-sm">{reg?.exams?.title ?? "–"}</td>
                        <td className="px-4 py-3 text-sm">{candidateName}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{e.message ?? "–"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(e.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setReviewing(e)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                          >
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

      {reviewing && <DetailPanel event={reviewing} onClose={() => setReviewing(null)} />}
    </AdminShell>
  );
}
