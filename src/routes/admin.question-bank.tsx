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
            <Button variant="outline" size="sm" disabled className="text-violet-600">
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