import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  GripVertical,
  Plus,
  Save,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  createQuestion,
  createSection,
  deleteQuestion,
  getExamWithContent,
  updateExam,
  updateQuestion,
  updateSection,
  type Question,
  type QuestionOption,
} from "@/lib/exams";

export const Route = createFileRoute("/admin/exams/$examId/builder")({
  component: BuilderPage,
  head: () => ({
    meta: [{ title: "Exam Builder · Orcalis Assess" }],
  }),
});

function BuilderPage() {
  const { examId } = Route.useParams();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "exam", examId],
    queryFn: () => getExamWithContent(examId),
  });

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    if (!selectedQuestionId && data?.questions[0]) {
      setSelectedQuestionId(data.questions[0].id);
    }
  }, [data, selectedQuestionId]);

  const selectedQuestion = useMemo(
    () => data?.questions.find((q) => q.id === selectedQuestionId) ?? null,
    [data, selectedQuestionId],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "exam", examId] });

  const handlePublish = async () => {
    if (!data) return;
    const next = data.exam.status === "published" ? "draft" : "published";
    setPublishing(true);
    try {
      await updateExam(examId, { status: next });
      await invalidate();
      toast.success(next === "published" ? "Exam published — candidates can now see it." : "Exam moved back to draft.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update exam status");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!draftTitle.trim() || !data) return;
    try {
      await updateExam(examId, { title: draftTitle.trim() });
      await invalidate();
      setEditingTitle(false);
      toast.success("Exam title saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save title");
    }
  };

  const handleSectionTimeLimit = async (sectionId: string, minutes: number | null) => {
    try {
      await updateSection(sectionId, { time_limit_minutes: minutes });
      await invalidate();
      toast.success("Section time limit updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update time limit");
    }
  };

  const handleAddSection = async () => {
    if (!data) return;
    try {
      const position = data.sections.length;
      await createSection({
        exam_id: examId,
        title: `Section ${position + 1}`,
        position,
      });
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add section");
    }
  };

  const handleAddQuestion = async (sectionId: string) => {
    if (!data) return;
    try {
      const sectionQuestions = data.questions.filter((q) => q.section_id === sectionId);
      const q = await createQuestion({
        section_id: sectionId,
        position: sectionQuestions.length,
      });
      setSelectedQuestionId(q.id);
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add question");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteQuestion(id);
      if (selectedQuestionId === id) setSelectedQuestionId(null);
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (isLoading || !data) {
    return (
      <AdminShell title="Loading…">
        <div className="mx-auto max-w-[1400px] py-12 text-center text-sm text-muted-foreground">
          Loading exam…
        </div>
      </AdminShell>
    );
  }

  const { exam, sections, questions } = data;

  return (
    <AdminShell
      title={exam.title}
      breadcrumbs={[
        { label: "Admin", to: "/admin" },
        { label: "Exams", to: "/admin/exams" },
        { label: "Builder" },
      ]}
      actions={
        <>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
              exam.status === "published"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : exam.status === "archived"
                  ? "bg-slate-100 text-slate-600 ring-slate-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200",
            )}
          >
            {exam.status}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {exam.status !== "archived" && (
              <Button
                size="sm"
                variant={exam.status === "published" ? "outline" : "default"}
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing
                  ? "Saving…"
                  : exam.status === "published"
                    ? "Unpublish"
                    : "Publish"}
              </Button>
            )}
          </div>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sections + questions list */}
        <div className="space-y-3">
          {sections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
              No sections yet.
            </div>
          ) : (
            sections.map((s) => {
              const sectionQs = questions.filter((q) => q.section_id === s.id);
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-2 px-1 py-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm font-semibold">{s.title}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {sectionQs.length} q
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-1 pb-1">
                    <Label className="text-[10px] text-muted-foreground shrink-0">Time limit</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="mins (0 = none)"
                      defaultValue={s.time_limit_minutes ?? ""}
                      className="h-6 text-xs px-2 py-0"
                      onBlur={(e) => {
                        const val = e.target.value === "" ? null : Number(e.target.value);
                        if (val !== s.time_limit_minutes) {
                          void handleSectionTimeLimit(s.id, val === 0 ? null : val);
                        }
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">min</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {sectionQs.map((q, i) => (
                      <li key={q.id}>
                        <button
                          onClick={() => setSelectedQuestionId(q.id)}
                          className={cn(
                            "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition",
                            selectedQuestionId === q.id
                              ? "bg-muted text-foreground"
                              : "text-foreground/75 hover:bg-muted/50",
                          )}
                        >
                          <span className="mt-0.5 text-xs font-semibold text-muted-foreground">
                            Q{i + 1}
                          </span>
                          <span className="line-clamp-2 flex-1">
                            {q.prompt || (
                              <span className="italic text-muted-foreground">
                                Untitled question
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 w-full justify-start text-xs text-muted-foreground"
                    onClick={() => handleAddQuestion(s.id)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add question
                  </Button>
                </div>
              );
            })
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddSection}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add section
          </Button>
        </div>

        {/* Editor */}
        <div className="rounded-2xl border border-border bg-background p-6">
          {selectedQuestion ? (
            <QuestionEditor
              key={selectedQuestion.id}
              question={selectedQuestion}
              onSaved={invalidate}
              onDelete={() => handleDeleteQuestion(selectedQuestion.id)}
            />
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3">Select a question or add a new one to start editing.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating status indicator */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-30">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background p-1 shadow-lg">
          <span className="px-3 text-xs text-muted-foreground">
            Questions auto-save on edit
          </span>
          <div className="mx-1 h-5 w-px bg-border" />
          <Button
            size="sm"
            className="rounded-full px-4"
            variant={exam.status === "published" ? "destructive" : "default"}
            onClick={handlePublish}
            disabled={publishing}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {publishing ? "Saving…" : exam.status === "published" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}

function QuestionEditor({
  question,
  onSaved,
  onDelete,
}: {
  question: Question;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [type, setType] = useState<Question["type"]>(question.type);
  const [difficulty, setDifficulty] = useState<Question["difficulty"]>(question.difficulty);
  const [points, setPoints] = useState<number>(question.points);
  const [shuffle, setShuffle] = useState(question.shuffle_options);
  const [options, setOptions] = useState<QuestionOption[]>(
    Array.isArray(question.options)
      ? (question.options as unknown as QuestionOption[])
      : [],
  );
  const [saving, setSaving] = useState(false);

  const updateOption = (i: number, patch: Partial<QuestionOption>) =>
    setOptions((opts) => opts.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const setCorrect = (i: number) =>
    setOptions((opts) => opts.map((o, idx) => ({ ...o, is_correct: idx === i })));

  const addOption = () =>
    setOptions((opts) => [...opts, { text: "", is_correct: false }]);

  const removeOption = (i: number) =>
    setOptions((opts) => opts.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateQuestion(question.id, {
        prompt,
        type,
        difficulty,
        points,
        shuffle_options: shuffle,
        options: options as unknown as Question["options"],
      });
      toast.success("Question saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="prompt">Question</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your question…"
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as Question["type"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Points</Label>
          <Input
            type="number"
            min={0}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      {type === "mcq" || type === "true_false" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Answer options</Label>
            {type === "mcq" && (
              <Button variant="ghost" size="sm" onClick={addOption}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add option
              </Button>
            )}
          </div>
          <ul className="space-y-2">
            {options.map((opt, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 transition",
                  opt.is_correct
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-border bg-background",
                )}
              >
                <button
                  type="button"
                  onClick={() => setCorrect(i)}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                    opt.is_correct
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-border bg-background text-transparent hover:border-foreground/40",
                  )}
                  aria-label="Mark as correct"
                >
                  <Check className="h-3 w-3" />
                </button>
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(i, { text: e.target.value })}
                  placeholder={`Option ${i + 1}`}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                {type === "mcq" && options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => removeOption(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Free-form answer. Grading happens after submission.
        </div>
      )}

      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="border-0">
          <AccordionTrigger className="text-sm font-semibold">
            Advanced logic & settings
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Shuffle options</p>
                  <p className="text-xs text-muted-foreground">
                    Randomize order for each candidate.
                  </p>
                </div>
                <Switch checked={shuffle} onCheckedChange={setShuffle} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="ghost" className="text-rose-600" onClick={onDelete}>
          <Trash2 className="mr-1.5 h-4 w-4" /> Delete question
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save question"}
        </Button>
      </div>
    </div>
  );
}