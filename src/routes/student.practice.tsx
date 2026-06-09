import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Sparkles, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  RotateCcw, BookOpen, Brain, Filter, Trophy, AlertCircle,
} from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listBankQuestions, type Question, type QuestionOption } from "@/lib/exams";

export const Route = createFileRoute("/student/practice")({
  component: StudentPracticePage,
  head: () => ({ meta: [{ title: "Practice Tests · Orcalis Assess" }] }),
});

// ---------- types ----------

type AnswerState =
  | { type: "mcq"; selected: number | null }
  | { type: "true_false"; selected: number | null }
  | { type: "descriptive" | "coding"; text: string };

type ReviewEntry = {
  question: Question;
  answer: AnswerState;
  correct: boolean;
  pointsEarned: number;
};

// ---------- helpers ----------

function getOptions(q: Question): QuestionOption[] {
  if (!q.options || !Array.isArray(q.options)) return [];
  return q.options as unknown as QuestionOption[];
}

function isAutoGradeable(q: Question) {
  return q.type === "mcq" || q.type === "true_false";
}

function checkAnswer(q: Question, ans: AnswerState): { correct: boolean; pointsEarned: number } {
  if (!isAutoGradeable(q)) return { correct: true, pointsEarned: q.points }; // ungraded — always give points in practice
  const opts = getOptions(q);
  if (ans.type !== "mcq" && ans.type !== "true_false") return { correct: false, pointsEarned: 0 };
  if (ans.selected === null) return { correct: false, pointsEarned: 0 };
  const chosen = opts[ans.selected];
  const correct = !!chosen?.is_correct;
  return { correct, pointsEarned: correct ? q.points : 0 };
}

function makeBlankAnswer(q: Question): AnswerState {
  if (q.type === "mcq") return { type: "mcq", selected: null };
  if (q.type === "true_false") return { type: "true_false", selected: null };
  return { type: q.type as "descriptive" | "coding", text: "" };
}

// ---------- sub-components ----------

function QuestionCard({
  q,
  answer,
  onAnswer,
  revealed,
}: {
  q: Question;
  answer: AnswerState;
  onAnswer: (a: AnswerState) => void;
  revealed: boolean;
}) {
  const opts = getOptions(q);
  const { correct } = checkAnswer(q, answer);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn(
          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
          q.type === "mcq" ? "bg-sky-50 text-sky-700 ring-sky-200" :
          q.type === "true_false" ? "bg-violet-50 text-violet-700 ring-violet-200" :
          q.type === "coding" ? "bg-orange-50 text-orange-700 ring-orange-200" :
          "bg-rose-50 text-rose-700 ring-rose-200"
        )}>
          {q.type === "mcq" ? "MCQ" : q.type === "true_false" ? "True / False" : q.type === "coding" ? "Coding" : "Essay"}
        </span>
        <span className={cn(
          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
          q.difficulty === "easy" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
          q.difficulty === "medium" ? "bg-amber-50 text-amber-700 ring-amber-200" :
          "bg-rose-50 text-rose-700 ring-rose-200"
        )}>
          {q.difficulty}
        </span>
        {q.subject && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {q.subject}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
      </div>

      <p className="text-base font-medium leading-relaxed">{q.prompt}</p>

      {(q.type === "mcq" || q.type === "true_false") && (
        <div className="space-y-2">
          {opts.map((opt, i) => {
            const chosen = answer.type === "mcq" || answer.type === "true_false" ? answer.selected === i : false;
            const showCorrect = revealed && opt.is_correct;
            const showWrong   = revealed && chosen && !opt.is_correct;
            return (
              <button
                key={i}
                disabled={revealed}
                onClick={() => onAnswer({ type: q.type as "mcq" | "true_false", selected: i })}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                  !revealed && !chosen && "border-border bg-background hover:bg-muted/40",
                  !revealed && chosen  && "border-blue-400 bg-blue-50 text-blue-900",
                  showCorrect          && "border-emerald-400 bg-emerald-50 text-emerald-900",
                  showWrong            && "border-rose-400 bg-rose-50 text-rose-800",
                  revealed && !chosen && !opt.is_correct && "border-border bg-muted/20 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition",
                    !revealed && !chosen  && "border-border text-muted-foreground",
                    !revealed && chosen   && "border-blue-500 bg-blue-500 text-white",
                    showCorrect           && "border-emerald-500 bg-emerald-500 text-white",
                    showWrong             && "border-rose-500 bg-rose-500 text-white",
                    revealed && !chosen && !opt.is_correct && "border-muted text-muted-foreground",
                  )}>
                    {showCorrect ? <CheckCircle2 className="h-3 w-3" /> :
                     showWrong   ? <XCircle className="h-3 w-3" /> :
                     String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt.text || `Option ${i + 1}`}</span>
                  {revealed && opt.is_correct && <span className="ml-auto text-[10px] font-bold text-emerald-700">Correct answer</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {(q.type === "descriptive" || q.type === "coding") && (
        <textarea
          disabled={revealed}
          value={answer.type === "descriptive" || answer.type === "coding" ? answer.text : ""}
          onChange={(e) => onAnswer({ type: q.type as "descriptive" | "coding", text: e.target.value })}
          rows={q.type === "coding" ? 10 : 6}
          placeholder={q.type === "coding" ? "Write your code here…" : "Write your answer here…"}
          className={cn(
            "w-full resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring",
            q.type === "coding" && "font-mono text-xs",
            revealed && "opacity-70",
          )}
        />
      )}

      {revealed && (
        <div className={cn(
          "flex items-start gap-3 rounded-xl border p-4",
          isAutoGradeable(q)
            ? correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
            : "border-sky-200 bg-sky-50"
        )}>
          {isAutoGradeable(q) ? (
            correct
              ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
          )}
          <div>
            {isAutoGradeable(q) ? (
              <p className={cn("text-sm font-semibold", correct ? "text-emerald-800" : "text-rose-800")}>
                {correct ? "Correct!" : "Incorrect"}
              </p>
            ) : (
              <p className="text-sm font-semibold text-sky-800">Practice submitted — self-review</p>
            )}
            {(q as any).explanation && (
              <p className="mt-1 text-sm text-muted-foreground">{(q as any).explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Results screen ----------

function ResultsScreen({
  entries,
  total,
  onRestart,
}: {
  entries: ReviewEntry[];
  total: number;
  onRestart: () => void;
}) {
  const scored = entries.filter((e) => isAutoGradeable(e.question));
  const earnedPts = entries.reduce((s, e) => s + e.pointsEarned, 0);
  const maxPts    = entries.reduce((s, e) => s + e.question.points, 0);
  const pct       = maxPts ? Math.round(earnedPts / maxPts * 100) : 0;
  const passed    = pct >= 50;

  const byType: Record<string, { correct: number; total: number }> = {};
  for (const e of entries) {
    if (!isAutoGradeable(e.question)) continue;
    const t = e.question.type;
    if (!byType[t]) byType[t] = { correct: 0, total: 0 };
    byType[t].total++;
    if (e.correct) byType[t].correct++;
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <div className={cn(
        "rounded-2xl border p-8 text-center",
        passed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
      )}>
        <div className={cn(
          "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
          passed ? "bg-emerald-100" : "bg-amber-100",
        )}>
          {passed ? <Trophy className="h-8 w-8 text-emerald-600" /> : <Brain className="h-8 w-8 text-amber-600" />}
        </div>
        <p className={cn("mt-4 text-3xl font-bold tabular-nums", passed ? "text-emerald-800" : "text-amber-800")}>
          {pct}%
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {earnedPts} / {maxPts} points · {scored.filter((e) => e.correct).length} of {scored.length} auto-graded correct
        </p>
        <p className={cn("mt-2 text-base font-semibold", passed ? "text-emerald-700" : "text-amber-700")}>
          {passed ? "Great work — you'd pass this exam!" : "Keep practising — you're building momentum."}
        </p>
      </div>

      {Object.keys(byType).length > 0 && (
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold">Breakdown by type</p>
          <div className="space-y-3">
            {Object.entries(byType).map(([type, stats]) => {
              const typePct = Math.round(stats.correct / stats.total * 100);
              return (
                <div key={type}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{type.replace("_", " ")}</span>
                    <span className="font-semibold tabular-nums">{stats.correct}/{stats.total} ({typePct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all", typePct >= 60 ? "bg-emerald-500" : "bg-amber-500")}
                      style={{ width: `${typePct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Review</p>
        {entries.map((e, idx) => {
          const auto = isAutoGradeable(e.question);
          return (
            <div key={e.question.id} className={cn(
              "rounded-xl border p-4",
              auto
                ? e.correct ? "border-emerald-100 bg-emerald-50/40" : "border-rose-100 bg-rose-50/40"
                : "border-border bg-muted/20",
            )}>
              <div className="flex items-start gap-3">
                {auto
                  ? e.correct
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Q{idx + 1}</p>
                  <p className="text-sm font-medium leading-snug">{e.question.prompt}</p>
                  {(e.question as any).explanation && (
                    <p className="mt-1 text-xs text-muted-foreground">{(e.question as any).explanation}</p>
                  )}
                </div>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground shrink-0">
                  {e.pointsEarned}/{e.question.points}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" className="gap-1.5" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
      </div>
    </div>
  );
}

// ---------- Main page ----------

type PracticeState = "select" | "active" | "done";

function StudentPracticePage() {
  const { data: allQuestions = [], isLoading } = useQuery({
    queryKey: ["student", "practice-bank"],
    queryFn: listBankQuestions,
  });

  const [subject, setSubject] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [count, setCount] = useState(10);
  const [state, setState] = useState<PracticeState>("select");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewEntries, setReviewEntries] = useState<ReviewEntry[]>([]);

  const subjects = useMemo(() => {
    const s = new Set(allQuestions.map((q) => q.subject).filter(Boolean) as string[]);
    return ["all", ...Array.from(s).sort()];
  }, [allQuestions]);

  const difficulties = ["all", "easy", "medium", "hard"];

  const filtered = useMemo(() => {
    return allQuestions.filter((q) => {
      return (
        (subject === "all" || q.subject === subject) &&
        (difficulty === "all" || q.difficulty === difficulty)
      );
    });
  }, [allQuestions, subject, difficulty]);

  const handleStart = () => {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, count);
    if (shuffled.length === 0) return;
    setQuestions(shuffled);
    setAnswers(shuffled.map(makeBlankAnswer));
    setCurrent(0);
    setRevealed(false);
    setReviewEntries([]);
    setState("active");
  };

  const handleReveal = () => setRevealed(true);

  const handleNext = () => {
    const q = questions[current];
    const ans = answers[current];
    const { correct, pointsEarned } = checkAnswer(q, ans);
    setReviewEntries((prev) => [...prev, { question: q, answer: ans, correct, pointsEarned }]);

    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
      setRevealed(false);
    } else {
      setState("done");
    }
  };

  const handleRestart = () => {
    setState("select");
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setRevealed(false);
    setReviewEntries([]);
  };

  if (state === "done") {
    return (
      <StudentShell>
        <div className="mx-auto w-full max-w-[1100px] space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Practice Tests</h1>
            <p className="text-sm text-muted-foreground">Practice session complete — see how you did.</p>
          </div>
          <ResultsScreen entries={reviewEntries} total={questions.length} onRestart={handleRestart} />
        </div>
      </StudentShell>
    );
  }

  if (state === "active" && questions.length > 0) {
    const q = questions[current];
    const ans = answers[current];
    const progress = Math.round((current / questions.length) * 100);

    return (
      <StudentShell>
        <div className="mx-auto w-full max-w-[760px] space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Practice Session</h1>
              <p className="text-sm text-muted-foreground">
                Question {current + 1} of {questions.length}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4" /> Exit
            </Button>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question card */}
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <QuestionCard
              q={q}
              answer={ans}
              onAnswer={(a) => setAnswers((prev) => { const next = [...prev]; next[current] = a; return next; })}
              revealed={revealed}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={current === 0}
              onClick={() => { setCurrent((c) => c - 1); setRevealed(false); }}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>

            <div className="flex items-center gap-2">
              {!revealed && (
                <Button variant="outline" size="sm" onClick={handleReveal} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Check answer
                </Button>
              )}
              <Button size="sm" onClick={handleNext} className="gap-1.5" style={{ background: "oklch(0.385 0.12 247)" }}>
                {current + 1 < questions.length ? (
                  <>Next <ChevronRight className="h-4 w-4" /></>
                ) : (
                  <>Finish <Trophy className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </StudentShell>
    );
  }

  // ---------- Select screen ----------
  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Practice Tests</h1>
          <p className="text-sm text-muted-foreground">
            Sharpen your skills with questions from the question bank — instant feedback, no exam pressure.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Questions available", value: allQuestions.length,                    icon: BookOpen, cls: "text-foreground"  },
            { label: "Subjects covered",    value: subjects.length - 1,                    icon: Filter,   cls: "text-sky-700"     },
            { label: "Easy questions",      value: allQuestions.filter((q) => q.difficulty === "easy").length,   icon: CheckCircle2, cls: "text-emerald-700" },
            { label: "Hard questions",      value: allQuestions.filter((q) => q.difficulty === "hard").length,   icon: Brain,        cls: "text-rose-700"    },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", s.cls)}>
                {isLoading ? "–" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Config card */}
        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">Customise your practice session</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>{s === "all" ? "All subjects" : s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background pl-3 pr-8 text-sm appearance-none cursor-pointer"
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>{d === "all" ? "All difficulties" : d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Number of questions <span className="text-foreground font-semibold">{count}</span>
              </label>
              <input
                type="range"
                min={5}
                max={Math.min(50, filtered.length || 50)}
                step={5}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>5</span>
                <span>{Math.min(50, filtered.length || 50)}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${filtered.length} question${filtered.length !== 1 ? "s" : ""} match your filters`}
            </p>
            <Button
              onClick={handleStart}
              disabled={filtered.length === 0 || isLoading}
              className="gap-1.5"
              style={{ background: "oklch(0.385 0.12 247)" }}
            >
              <Sparkles className="h-4 w-4" />
              Start practice
            </Button>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
