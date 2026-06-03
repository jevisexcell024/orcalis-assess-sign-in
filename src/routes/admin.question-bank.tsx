import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Plus,
  Upload,
  Sparkles,
  ListChecks,
  Code2,
  FileText,
  ToggleLeft,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createBankQuestion, listBankQuestions, type Question } from "@/lib/exams";
import { generateQuestions, type GeneratedQuestion, type Difficulty, type QuestionType } from "@/lib/ai";
import { Loader2, CheckCheck, AlertCircle, Brain } from "lucide-react";

export const Route = createFileRoute("/admin/question-bank")({
  component: QuestionBankPage,
  head: () => ({
    meta: [{ title: "Question Bank · Orcalis Assess" }],
  }),
});

const typeMeta: Record<
  Question["type"],
  { label: string; icon: typeof ListChecks; tone: string }
> = {
  mcq: { label: "MCQ", icon: ListChecks, tone: "bg-sky-50 text-sky-700" },
  true_false: { label: "True/False", icon: ToggleLeft, tone: "bg-indigo-50 text-indigo-700" },
  descriptive: { label: "Essay", icon: FileText, tone: "bg-emerald-50 text-emerald-700" },
  coding: { label: "Coding", icon: Code2, tone: "bg-violet-50 text-violet-700" },
};

const difficultyTone: Record<Question["difficulty"], string> = {
  easy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  hard: "bg-rose-50 text-rose-700 ring-rose-200",
};

function QuestionBankPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin", "question-bank"],
    queryFn: listBankQuestions,
  });

  const subjects = useMemo(() => {
    const set = new Set<string>();
    items?.forEach((q) => q.subject && set.add(q.subject));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    return (items ?? []).filter((q) => {
      if (subjectFilter !== "all" && q.subject !== subjectFilter) return false;
      if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
      if (typeFilter !== "all" && q.type !== typeFilter) return false;
      return true;
    });
  }, [items, subjectFilter, difficultyFilter, typeFilter]);

  return (
    <AdminShell
      title="Question Bank"
      breadcrumbs={[
        { label: "Repository", to: "/admin" },
        { label: "Question Bank" },
      ]}
    >
      <div className="mx-auto w-full max-w-[1200px] space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Question Repository</h1>
            <p className="text-sm text-muted-foreground">
              Manage, organize, and generate questions for your examination ecosystem.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Upload className="mr-1.5 h-4 w-4" /> Import
            </Button>
            <Button variant="outline" size="sm" className="text-violet-600" onClick={() => setAiOpen(true)}>
              <Sparkles className="mr-1.5 h-4 w-4" /> AI Generate
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New Question
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger><SelectValue placeholder="All Subjects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger><SelectValue placeholder="Any Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Difficulty</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mcq">MCQ</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="descriptive">Essay</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_180px_120px] gap-3 border-b border-border px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Checkbox disabled />
            <span>Question Preview</span>
            <span>Attributes</span>
            <span className="text-right">Actions</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Loading questions…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ListChecks className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No questions in the bank</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first reusable question to start building exams faster.
              </p>
              <Button className="mt-4" size="sm" onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> New Question
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((q) => {
                const tm = typeMeta[q.type];
                return (
                  <li
                    key={q.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_180px_120px] items-start gap-3 px-4 py-4"
                  >
                    <Checkbox />
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                          tm.tone,
                        )}
                      >
                        <tm.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm leading-snug">
                          {q.prompt || (
                            <span className="italic text-muted-foreground">
                              Untitled question
                            </span>
                          )}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {q.subject && (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/80">
                              {q.subject}
                            </span>
                          )}
                          {q.tags?.map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 capitalize",
                          difficultyTone[q.difficulty],
                        )}
                      >
                        {q.difficulty}
                      </span>
                      <p className="text-[11px] text-muted-foreground">{tm.label}</p>
                    </div>
                    <div className="flex justify-end">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Unused
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filtered.length} of {items?.length ?? 0} questions
            </span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled>Prev</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </div>
      </div>

      <AIGeneratorDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onImport={async (qs) => {
          for (const q of qs) {
            await createBankQuestion({
              prompt: q.prompt,
              type: q.type,
              difficulty: q.difficulty,
              points: q.points,
              options: q.options ?? [],
              tags: q.tags,
              subject: q.subject,
              shuffle_options: q.type === "mcq",
            });
          }
          await qc.invalidateQueries({ queryKey: ["admin", "question-bank"] });
        }}
      />
      <NewQuestionDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={() => qc.invalidateQueries({ queryKey: ["admin", "question-bank"] })}
      />
    </AdminShell>
  );
}

function NewQuestionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<Question["type"]>("mcq");
  const [difficulty, setDifficulty] = useState<Question["difficulty"]>("medium");
  const [subject, setSubject] = useState("");
  const [tags, setTags] = useState("");
  const [points, setPoints] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setPrompt(""); setType("mcq"); setDifficulty("medium");
    setSubject(""); setTags(""); setPoints(1);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setSubmitting(true);
    try {
      await createBankQuestion({
        prompt: prompt.trim(),
        type,
        difficulty,
        subject: subject.trim() || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        points,
      });
      toast.success("Question added to bank");
      onCreated();
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New question</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qprompt">Question</Label>
            <Textarea
              id="qprompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type the question prompt…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as Question["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple choice</SelectItem>
                  <SelectItem value="true_false">True / False</SelectItem>
                  <SelectItem value="descriptive">Descriptive</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as Question["difficulty"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Algorithms"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min={0}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. CS-301, Algorithms"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !prompt.trim()}>
            {submitting ? "Saving…" : "Add to bank"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ── AI Question Generator Dialog ─────────────────────────────────────────────
function AIGeneratorDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (questions: GeneratedQuestion[]) => Promise<void>;
}) {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [context, setContext] = useState("");
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [types, setTypes] = useState<QuestionType[]>(["mcq"]);
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
    { value: "mcq",         label: "Multiple Choice" },
    { value: "true_false",  label: "True / False"    },
    { value: "descriptive", label: "Essay"           },
    { value: "coding",      label: "Coding"          },
  ];

  const toggleType = (t: QuestionType) =>
    setTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const toggleSelect = (i: number) =>
    setSelected((prev) => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(null); setGenerated([]); setSelected(new Set());
    try {
      const qs = await generateQuestions({
        topic: topic.trim(),
        subject: subject.trim() || undefined,
        context: context.trim() || undefined,
        difficulty,
        count: Math.min(20, Math.max(1, Number(count))),
        types: types.length ? types : ["mcq"],
      });
      setGenerated(qs);
      setSelected(new Set(qs.map((_, i) => i)));
    } catch (e: any) {
      setError(e.message ?? "Generation failed. Check your OpenAI API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const toImport = generated.filter((_, i) => selected.has(i));
    if (!toImport.length) return;
    setImporting(true);
    try {
      await onImport(toImport);
      toast.success(`${toImport.length} question${toImport.length !== 1 ? "s" : ""} added to question bank.`);
      onClose();
      setGenerated([]); setSelected(new Set()); setTopic("");
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-600" />
            AI Question Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Config */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Topic <span className="text-rose-500">*</span></Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Newton's Laws of Motion" />
            </div>
            <div className="space-y-1.5">
              <Label>Subject (optional)</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics" />
            </div>
            <div className="space-y-1.5">
              <Label>Number of questions</Label>
              <Input type="number" min="1" max="20" value={count}
                onChange={(e) => setCount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Question types</Label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((t) => (
                  <button key={t.value} type="button"
                    onClick={() => toggleType(t.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                      types.includes(t.value)
                        ? "border-transparent text-white"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                    style={types.includes(t.value) ? { background: "var(--gradient-primary)" } : undefined}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Curriculum context (optional)</Label>
              <Textarea value={context} onChange={(e) => setContext(e.target.value)}
                placeholder="Paste relevant syllabus excerpt or learning objectives…"
                rows={2} />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate Questions</>}
          </Button>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Generated questions */}
          {generated.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{generated.length} questions generated — select to import:</p>
                <button className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSelected(selected.size === generated.length ? new Set() : new Set(generated.map((_, i) => i)))}>
                  {selected.size === generated.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              {generated.map((q, i) => (
                <div key={i}
                  onClick={() => toggleSelect(i)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 transition select-none",
                    selected.has(i) ? "border-violet-300 bg-violet-50/40" : "border-border bg-background hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                      selected.has(i) ? "border-violet-500 bg-violet-500" : "border-muted-foreground",
                    )}>
                      {selected.has(i) && <CheckCheck className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-1.5">
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-200 uppercase">
                          {q.type.replace("_", "/")}
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 uppercase", difficultyTone[q.difficulty])}>
                          {q.difficulty}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {q.points} pt{q.points !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug">{q.prompt}</p>
                      {q.options && q.options.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {q.options.map((opt, j) => (
                            <li key={j} className={cn("text-xs", opt.is_correct ? "text-emerald-700 font-semibold" : "text-muted-foreground")}>
                              {opt.is_correct ? "✓ " : "○ "}{opt.text}
                            </li>
                          ))}
                        </ul>
                      )}
                      {q.explanation && (
                        <p className="mt-2 text-[11px] text-muted-foreground italic">💡 {q.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={importing}>Cancel</Button>
          {generated.length > 0 && (
            <Button onClick={handleImport} disabled={importing || selected.size === 0} className="gap-1.5">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              {importing ? "Importing…" : `Import ${selected.size} question${selected.size !== 1 ? "s" : ""}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
