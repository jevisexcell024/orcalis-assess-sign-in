import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Eye, Search,
  Brain, FileSearch, Fingerprint, ChevronDown,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/academic-integrity")({
  component: AcademicIntegrityPage,
  head: () => ({ meta: [{ title: "Academic Integrity · Orcalis Assess" }] }),
});

async function listIntegrityChecks() {
  const { data, error } = await (supabase as any)
    .from("integrity_checks")
    .select(`
      id, check_type, score, threshold, flagged, cleared, created_at,
      exam_attempts(id, submitted_at, exam_registrations(exams(title)))
    `)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

const CHECK_META: Record<string, { label: string; icon: typeof Brain; cls: string }> = {
  plagiarism:         { label: "Plagiarism",        icon: FileSearch,   cls: "bg-rose-50   text-rose-700   ring-rose-200"   },
  ai_generated:       { label: "AI Generated",      icon: Brain,        cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  copy_paste:         { label: "Copy-Paste",        icon: FileSearch,   cls: "bg-orange-50 text-orange-700 ring-orange-200" },
  external_resource:  { label: "External Resource", icon: ShieldAlert,  cls: "bg-amber-50  text-amber-700  ring-amber-200"  },
  identity_mismatch:  { label: "Identity Mismatch", icon: Fingerprint,  cls: "bg-rose-50   text-rose-700   ring-rose-200"   },
};

const MOCK_CHECKS = [
  { id: "1", check_type: "plagiarism",        score: 0.87, threshold: 0.8, flagged: true,  cleared: false, created_at: "2026-06-01T10:00:00Z", exam: "CS101 Final" },
  { id: "2", check_type: "ai_generated",      score: 0.93, threshold: 0.8, flagged: true,  cleared: false, created_at: "2026-06-01T09:30:00Z", exam: "Essay Writing Assessment" },
  { id: "3", check_type: "copy_paste",        score: 0.61, threshold: 0.8, flagged: false, cleared: null,  created_at: "2026-05-31T14:00:00Z", exam: "Physics Practical" },
  { id: "4", check_type: "external_resource", score: 0.45, threshold: 0.8, flagged: false, cleared: null,  created_at: "2026-05-30T11:00:00Z", exam: "MBA Finance" },
  { id: "5", check_type: "identity_mismatch", score: 0.92, threshold: 0.8, flagged: true,  cleared: true,  created_at: "2026-05-29T16:00:00Z", exam: "Nursing Board Exam" },
];

function AcademicIntegrityPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [flagFilter, setFlagFilter] = useState("all");

  // Use mock while integrity_checks table populates
  const checks = MOCK_CHECKS;
  const flagged = checks.filter((c) => c.flagged && !c.cleared).length;
  const cleared = checks.filter((c) => c.cleared).length;
  const clean   = checks.filter((c) => !c.flagged).length;

  const filtered = checks.filter((c) => {
    const matchSearch = !search || c.exam.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || c.check_type === typeFilter;
    const matchFlag = flagFilter === "all"
      || (flagFilter === "flagged" && c.flagged && !c.cleared)
      || (flagFilter === "cleared" && c.cleared)
      || (flagFilter === "clean" && !c.flagged);
    return matchSearch && matchType && matchFlag;
  });

  return (
    <AdminShell
      title="Academic Integrity Center"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Academic Integrity" }]}
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-6">
        {/* Alert banner */}
        {flagged > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <p className="text-sm text-rose-800">
              <strong>{flagged} integrity violations</strong> require review. Review and clear or escalate each flagged submission.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Checks",  value: checks.length, cls: "text-foreground"  },
            { label: "Flagged",       value: flagged,       cls: "text-rose-700"    },
            { label: "Cleared",       value: cleared,       cls: "text-emerald-700" },
            { label: "Clean",         value: clean,         cls: "text-sky-700"     },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Check type cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(CHECK_META).map(([key, meta]) => {
            const count = checks.filter((c) => c.check_type === key).length;
            const flagCount = checks.filter((c) => c.check_type === key && c.flagged).length;
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(typeFilter === key ? "all" : key)}
                className={cn(
                  "rounded-xl border p-4 text-left transition hover:shadow-md",
                  typeFilter === key ? "border-transparent text-white shadow-md" : "border-border bg-background",
                )}
                style={typeFilter === key ? { background: "var(--gradient-primary)" } : undefined}
              >
                <meta.icon className={cn("h-5 w-5 mb-2", typeFilter === key ? "text-white" : "text-muted-foreground")} />
                <p className={cn("text-xs font-medium", typeFilter === key ? "text-white" : "text-foreground")}>{meta.label}</p>
                <p className={cn("text-lg font-bold tabular-nums", typeFilter === key ? "text-white" : "text-foreground")}>{count}</p>
                {flagCount > 0 && (
                  <p className={cn("text-[11px]", typeFilter === key ? "text-white/80" : "text-rose-600")}>{flagCount} flagged</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by exam title…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9" />
          </div>
          <div className="relative">
            <select value={flagFilter} onChange={(e) => setFlagFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer">
              <option value="all">All</option>
              <option value="flagged">Flagged</option>
              <option value="cleared">Cleared</option>
              <option value="clean">Clean</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Check Type</th>
                  <th className="px-4 py-3 font-medium">Exam</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">No integrity checks found.</td></tr>
                ) : (
                  filtered.map((c) => {
                    const meta = CHECK_META[c.check_type];
                    const Icon = meta?.icon ?? ShieldAlert;
                    const pct = Math.round((c.score ?? 0) * 100);
                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", meta?.cls ?? "bg-muted text-muted-foreground")}>
                            <Icon className="h-3 w-3" />
                            {meta?.label ?? c.check_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{c.exam}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full", pct >= 80 ? "bg-rose-500" : "bg-emerald-500")}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={cn("text-xs font-bold tabular-nums", pct >= 80 ? "text-rose-700" : "text-emerald-700")}>{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {c.cleared === true ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 className="h-3 w-3" /> Cleared</span>
                          ) : c.flagged ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200"><AlertTriangle className="h-3 w-3" /> Flagged</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 className="h-3 w-3" /> Clean</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition">
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
        </div>
      </div>
    </AdminShell>
  );
}
