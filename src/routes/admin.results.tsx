import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  CheckCircle2, Clock, Search, Download, Send,
  ChevronDown, AlertTriangle, BarChart2, X,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/csv";
import {
  getAttemptForReview,
  gradeAnswer,
  finalizeManualGrade,
  type Question,
  type QuestionOption,
} from "@/lib/exams";
import type { ExamAnswer } from "@/lib/exams";

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

// ---------- Review Dialog ----------

function AttemptReviewDialog({
  attemptId,
  examTitle,
  onClose,
  onSaved,
}: {
  attemptId: string;
  examTitle: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "attempt-review", attemptId],
    queryFn: () => getAttemptForReview(attemptId),
  });

  // local scores for descriptive/coding: answerId → points string
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const qMap = useMemo(() => {
    const m: Record<string, Question> = {};
    for (const q of data?.questions ?? []) m[q.id] = q;
    return m;
  }, [data]);

  const answers = data?.answers ?? [];

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each manually entered score
      const tasks: Promise<void>[] = [];
      for (const [answerId, rawPts] of Object.entries(scores)) {
        const pts = parseFloat(rawPts);
        if (!isNaN(pts)) tasks.push(gradeAnswer(answerId, pts));
      }
      await Promise.all(tasks);
      const total = await finalizeManualGrade(attemptId);
      toast.success(`Grades saved — total score: ${total}`);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save grades");
    } finally {
      setSaving(false);
    }
  };

  const needsManualGrading = answers.some((a) => {
    const q = qMap[a.question_id];
    return q?.type === "descriptive" || q?.type === "coding";
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-background shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-semibold">Answer Sheet Review</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {examTitle} · <span className="font-mono">{attemptId.slice(0, 12)}…</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
          ) : answers.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No answers recorded for this attempt.</p>
          ) : (
            <ol className="space-y-6">
              {answers.map((ans, idx) => {
                const q = qMap[ans.question_id];
                if (!q) return null;

                const isManual = q.type === "descriptive" || q.type === "coding";
                const opts = (q.options as unknown as QuestionOption[]) ?? [];

                // For MCQ/T-F: figure out selected + correctness
                const selectedIdx = (ans.response as { selected?: number } | null)?.selected;
                const selectedOpt = selectedIdx !== undefined ? opts[selectedIdx] : undefined;

                // For descriptive/coding
                const textResponse = (ans.response as { text?: string } | null)?.text ?? "";

                const currentScore = scores[ans.id] ?? (ans.points_awarded !== null ? String(ans.points_awarded) : "");

                return (
                  <li key={ans.id} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                          {idx + 1}
                        </span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                          q.type === "mcq" ? "bg-sky-50 text-sky-700 ring-sky-200" :
                          q.type === "true_false" ? "bg-violet-50 text-violet-700 ring-violet-200" :
                          q.type === "coding" ? "bg-orange-50 text-orange-700 ring-orange-200" :
                          "bg-rose-50 text-rose-700 ring-rose-200"
                        )}>
                          {q.type === "mcq" ? "MCQ" : q.type === "true_false" ? "T/F" : q.type === "coding" ? "Code" : "Essay"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
                    </div>

                    <p className="mb-3 text-sm font-medium leading-snug">
                      {q.prompt || <span className="italic text-muted-foreground">Untitled question</span>}
                    </p>

                    {!isManual ? (
                      /* MCQ / T-F — show selected option + correctness */
                      <div className="space-y-1.5">
                        {opts.map((opt, i) => {
                          const isSelected = selectedIdx === i;
                          const isCorrect = opt.is_correct;
                          return (
                            <div
                              key={i}
                              className={cn(
                                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                                isSelected && isCorrect && "border-emerald-300 bg-emerald-50 text-emerald-800",
                                isSelected && !isCorrect && "border-rose-300 bg-rose-50 text-rose-800",
                                !isSelected && isCorrect && "border-emerald-200 bg-emerald-50/50 text-emerald-700",
                                !isSelected && !isCorrect && "border-border bg-background text-muted-foreground",
                              )}
                            >
                              {isSelected ? (
                                isCorrect
                                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                  : <X className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                              ) : isCorrect ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                              ) : (
                                <span className="h-3.5 w-3.5 shrink-0" />
                              )}
                              {opt.text || <span className="italic">Option {i + 1}</span>}
                              {isSelected && <span className="ml-auto text-[10px] font-semibold">Selected</span>}
                              {!isSelected && isCorrect && <span className="ml-auto text-[10px] font-semibold">Correct answer</span>}
                            </div>
                          );
                        })}
                        <p className="mt-1 text-right text-xs text-muted-foreground">
                          Points: {ans.points_awarded ?? 0} / {q.points}
                        </p>
                      </div>
                    ) : (
                      /* Descriptive / Coding — show text + score input */
                      <div className="space-y-3">
                        <Textarea
                          readOnly
                          value={textResponse || "(no response)"}
                          rows={q.type === "coding" ? 8 : 5}
                          className={cn(
                            "resize-none bg-background",
                            q.type === "coding" && "font-mono text-xs",
                            !textResponse && "text-muted-foreground italic",
                          )}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <label className="text-xs text-muted-foreground">Points awarded:</label>
                          <input
                            type="number"
                            min={0}
                            max={q.points}
                            step={0.5}
                            value={currentScore}
                            onChange={(e) => setScores((prev) => ({ ...prev, [ans.id]: e.target.value }))}
                            className="w-20 rounded-md border border-border bg-background px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="0"
                          />
                          <span className="text-xs text-muted-foreground">/ {q.points}</span>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Close</Button>
          {needsManualGrading && (
            <Button onClick={handleSave} disabled={saving || isLoading}>
              {saving ? "Saving…" : "Save grades"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Results Page ----------

function ResultsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [reviewAttempt, setReviewAttempt] = useState<{ id: string; title: string } | null>(null);
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

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "results"] });

  return (
    <AdminShell
      title="Result Management"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Results" }]}
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Submissions",  value: stats.total,          icon: BarChart2,    cls: "text-foreground" },
            { label: "Auto-Scored",        value: stats.autoScored,     icon: CheckCircle2, cls: "text-emerald-700" },
            { label: "Needs Grading",      value: stats.pending,        icon: Clock,        cls: "text-amber-700"  },
            { label: "Avg Score",          value: `${stats.avgScore}%`, icon: BarChart2,    cls: "text-sky-700"    },
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
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              exportToCSV(
                `results-${new Date().toISOString().slice(0,10)}.csv`,
                filtered as any[],
                [
                  { key: "id",                             header: "ID" },
                  { key: "exam_registrations.exams.title", header: "Exam" },
                  { key: "score",                          header: "Score" },
                  { key: "max_score",                      header: "Max Score" },
                  { key: "auto_scored",                    header: "Auto Scored" },
                  { key: "submitted_at",                   header: "Submitted At" },
                ]
              );
              toast.success(`Exported ${filtered.length} results`);
            }}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => toast.success(`${stats.autoScored} results queued for publishing.`)}>
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
                    const title = (a as any).exam_registrations?.exams?.title ?? "–";
                    const pct = a.max_score ? ((a.score ?? 0) / a.max_score * 100).toFixed(1) : "–";
                    return (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{title}</td>
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
                            onClick={() => setReviewAttempt({ id: a.id, title })}
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

      {reviewAttempt && (
        <AttemptReviewDialog
          attemptId={reviewAttempt.id}
          examTitle={reviewAttempt.title}
          onClose={() => setReviewAttempt(null)}
          onSaved={() => {
            setReviewAttempt(null);
            void invalidate();
          }}
        />
      )}
    </AdminShell>
  );
}
