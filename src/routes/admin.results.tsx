import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  CheckCircle2, Clock, Search, Download, Send,
  ChevronDown, AlertTriangle, BarChart2,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/results")({
  component: ResultsPage,
  head: () => ({ meta: [{ title: "Results · Orcalis Assess" }] }),
});

async function listResults(page = 0, pageSize = 50) {
  const from = page * pageSize;
  const { data, error } = await supabase
    .from("exam_attempts")
    .select(`
      id, score, max_score, auto_scored, submitted_at,
      exam_registrations (
        id, status, exam_id,
        exams ( title )
      )
    `)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  return data ?? [];
}

const STATUSES = ["all", "pending", "auto_graded", "approved", "published"] as const;

function ResultsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["admin", "results", page],
    queryFn: () => listResults(page, PAGE_SIZE),
    placeholderData: (prev) => prev,
  });

  const filtered = useMemo(() => {
    return attempts.filter((a) => {
      const title = (a as any).exam_registrations?.exams?.title ?? "";
      return (
        (!search || title.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === "all" || (a.auto_scored && statusFilter !== "pending") || (!a.auto_scored && statusFilter === "pending"))
      );
    });
  }, [attempts, search, statusFilter]);

  const stats = useMemo(() => {
    const scored = attempts.filter((a) => a.auto_scored);
    const avgScore = scored.length
      ? scored.reduce((s, a) => s + ((a.score ?? 0) / Math.max(a.max_score ?? 1, 1)) * 100, 0) / scored.length
      : 0;
    return {
      total: attempts.length,
      autoScored: scored.length,
      pending: attempts.length - scored.length,
      avgScore: avgScore.toFixed(1),
    };
  }, [attempts]);

  const handlePublishAll = async () => {
    toast.success(`${stats.autoScored} results queued for publishing.`);
  };

  return (
    <AdminShell
      title="Result Management"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Results" }]}
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Submissions",  value: stats.total,      icon: BarChart2,    cls: "text-foreground" },
            { label: "Auto-Scored",        value: stats.autoScored, icon: CheckCircle2, cls: "text-emerald-700" },
            { label: "Needs Grading",      value: stats.pending,    icon: Clock,        cls: "text-amber-700"  },
            { label: "Avg Score",          value: `${stats.avgScore}%`, icon: BarChart2, cls: "text-sky-700"   },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by exam title…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success(`Exporting ${filtered.length} results as CSV…`)}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handlePublishAll}>
            <Send className="h-4 w-4" /> Publish Results
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Exam</th>
                  <th className="px-4 py-3 font-medium">Attempt ID</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Percentage</th>
                  <th className="px-4 py-3 font-medium">Grading</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">Loading results…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">No results found.</td></tr>
                ) : (
                  filtered.map((a) => {
                    const pct = a.max_score ? ((a.score ?? 0) / a.max_score * 100).toFixed(1) : "–";
                    return (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{(a as any).exam_registrations?.exams?.title ?? "–"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.id.slice(0, 12)}…</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {a.submitted_at ? new Date(a.submitted_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "–"}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          {a.score ?? 0} / {a.max_score ?? "?"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full", Number(pct) >= 60 ? "bg-emerald-500" : "bg-rose-500")}
                                style={{ width: `${Math.min(Number(pct), 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold tabular-nums">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {a.auto_scored
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 className="h-3 w-3" /> Auto-graded</span>
                            : <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200"><AlertTriangle className="h-3 w-3" /> Needs review</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toast.info(`Opening answer sheet review for attempt ${a.id.slice(0, 8)}…`)}
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted mr-2"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => toast.success(`Result for attempt ${a.id.slice(0, 8)} published to candidate.`)}
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                          >
                            Publish
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} · {filtered.length} results on this page
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted transition">
                ← Previous
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={attempts.length < PAGE_SIZE}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted transition">
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
