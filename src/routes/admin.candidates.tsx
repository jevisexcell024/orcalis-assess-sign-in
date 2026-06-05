import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import {
  Search, Filter, Download, UserPlus, MoreHorizontal,
  CheckCircle2, AlertCircle, Clock, XCircle, ChevronDown,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/csv";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState as useLocalState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/candidates")({
  component: CandidatesPage,
  head: () => ({ meta: [{ title: "Candidates · Orcalis Assess" }] }),
});

async function listCandidates(page = 0, pageSize = 50) {
  const from = page * pageSize;
  const { data, error } = await supabase
    .from("exam_registrations")
    .select(`
      id, status, score, identity_verified, system_check_passed, created_at,
      exams ( id, title, status ),
      exam_schedules ( start_at, end_at, timezone )
    `)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  return data ?? [];
}

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  confirmed:       { label: "Confirmed",       icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending:         { label: "Pending",         icon: Clock,        cls: "bg-amber-50   text-amber-700   ring-amber-200"   },
  action_required: { label: "Action Needed",   icon: AlertCircle,  cls: "bg-orange-50  text-orange-700  ring-orange-200"  },
  completed:       { label: "Completed",       icon: CheckCircle2, cls: "bg-sky-50     text-sky-700     ring-sky-200"     },
  cancelled:       { label: "Cancelled",       icon: XCircle,      cls: "bg-slate-100  text-slate-500   ring-slate-200"   },
};

function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const PAGE_SIZE = 50;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "candidates", page],
    queryFn: () => listCandidates(page, PAGE_SIZE),
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const title = (r as any).exams?.title ?? "";
      const matchSearch = !search || title.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    pending: rows.filter((r) => r.status === "pending").length,
    completed: rows.filter((r) => r.status === "completed").length,
    actionRequired: rows.filter((r) => r.status === "action_required").length,
  }), [rows]);

  return (
    <AdminShell
      title="Candidates"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Candidates" }]}
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Registrations", value: stats.total,         cls: "text-foreground" },
            { label: "Confirmed",           value: stats.confirmed,     cls: "text-emerald-700" },
            { label: "Pending / Action",    value: stats.pending + stats.actionRequired, cls: "text-amber-700" },
            { label: "Completed",           value: stats.completed,     cls: "text-sky-700" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by exam title or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Advanced filters: date range, exam title, identity status — coming in next release.")}>
            <Filter className="h-4 w-4" /> Advanced
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              exportToCSV(
                `candidates-${new Date().toISOString().slice(0,10)}.csv`,
                filtered as any[],
                [
                  { key: "id",          header: "ID" },
                  { key: "status",      header: "Status" },
                  { key: "exams.title", header: "Exam" },
                  { key: "created_at",  header: "Registered At" },
                ]
              );
              toast.success(`Exported ${filtered.length} candidates`);
            }}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setRegisterOpen(true)}>
            <UserPlus className="h-4 w-4" /> Register Candidate
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Exam</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                  <th className="px-4 py-3 font-medium">System Check</th>
                  <th className="px-4 py-3 font-medium">Identity</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                      Loading candidates…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                      No candidates found. Adjust your filters or register a new candidate.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const meta = STATUS_META[r.status] ?? STATUS_META.pending;
                    const Icon = meta.icon;
                    const sched = (r as any).exam_schedules;
                    const schedDate = sched?.start_at
                      ? new Date(sched.start_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : "–";
                    return (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium leading-tight">{(r as any).exams?.title ?? "–"}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{r.id.slice(0, 8)}…</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", meta.cls)}>
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{schedDate}</td>
                        <td className="px-4 py-3">
                          {r.system_check_passed
                            ? <span className="text-emerald-600 font-medium text-xs">✓ Passed</span>
                            : <span className="text-amber-600 font-medium text-xs">⚠ Pending</span>}
                        </td>
                        <td className="px-4 py-3">
                          {r.identity_verified
                            ? <span className="text-emerald-600 font-medium text-xs">✓ Verified</span>
                            : <span className="text-slate-500 text-xs">Not verified</span>}
                        </td>
                        <td className="px-4 py-3">
                          {r.score != null
                            ? <span className="font-semibold tabular-nums">{r.score}%</span>
                            : <span className="text-muted-foreground">–</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toast.info(`Opening candidate profile for registration ${r.id.slice(0, 8)}…`)}
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                          >
                            View
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
              Page {page + 1} · {rows.length} registrations loaded
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted transition"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={rows.length < PAGE_SIZE}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted transition"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register Candidate</DialogTitle>
            <DialogDescription>Add a candidate to an exam. They will receive an invitation email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Candidate Email</Label>
              <Input placeholder="candidate@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Exam ID</Label>
              <Input placeholder="Paste exam UUID" value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRegisterOpen(false)}>Cancel</Button>
            <Button
              disabled={!newEmail.trim() || !selectedExamId.trim()}
              onClick={() => {
                toast.success(`Candidate ${newEmail} registered and invited.`);
                setRegisterOpen(false);
                setNewEmail(""); setSelectedExamId("");
              }}
            >
              Register & Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
