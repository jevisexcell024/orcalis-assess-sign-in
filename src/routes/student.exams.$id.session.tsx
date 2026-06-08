import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Camera, Eye, EyeOff, Maximize2, Mic, ShieldCheck, Users, X } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useProctoring } from "@/lib/proctoring";
import { getSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  startOrResumeAttempt,
  saveAnswer,
  submitAttempt,
  type ExamAnswer,
  type Question,
  type QuestionOption,
} from "@/lib/exams";

export const Route = createFileRoute("/student/exams/$id/session")({
  head: () => ({
    meta: [
      { title: "Live Exam · Orcalis Assess" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ to: "/" });
  },
  component: ExamSessionPage,
});

function ExamSessionPage() {
  const { id: registrationId } = Route.useParams();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(60 * 60); // 60-min default, overridden on start
  const [secondsLeft, setSecondsLeft] = useState(60 * 60);
  const [examTitle, setExamTitle] = useState("Live Exam");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, ExamAnswer["response"]>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const warnedRef = { fiveMin: false, fifteenMin: false, thirtyMin: false };
  const warnedMins = { fiveMin: false, fifteenMin: false, thirtyMin: false };

  const { videoRef, state, requestFullscreen, endSession } = useProctoring(
    started ? registrationId : null,
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("exam_registrations")
        .select("exam_id, exams:exam_id(title, exam_sections(time_limit_minutes))")
        .eq("id", registrationId)
        .maybeSingle();
      type Reg = { exams?: { title?: string; exam_sections?: Array<{ time_limit_minutes: number | null }> } | null };
      const reg = data as unknown as Reg | null;
      const title = reg?.exams?.title;
      if (title) setExamTitle(title);
      // Use the first section's time limit if set, else default 60 min
      const firstLimit = reg?.exams?.exam_sections?.[0]?.time_limit_minutes;
      if (firstLimit && firstLimit > 0) {
        const secs = firstLimit * 60;
        setDurationSeconds(secs);
        setSecondsLeft(secs);
      }
    })();
  }, [registrationId]);

  // Countdown timer — auto-submit when it hits zero + milestone warnings
  useEffect(() => {
    if (!started) return;
    const warned = { thirtyMin: false, fifteenMin: false, fiveMin: false };
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          if (attemptId) {
            toast.info("Time's up — submitting your exam…");
            void handleEnd();
          }
          return 0;
        }
        const next = s - 1;
        if (next === 30 * 60 && !warned.thirtyMin) {
          warned.thirtyMin = true;
          toast.warning("⏰ 30 minutes remaining — pace yourself.");
        }
        if (next === 15 * 60 && !warned.fifteenMin) {
          warned.fifteenMin = true;
          toast.warning("⏰ 15 minutes remaining — review your answers.");
        }
        if (next === 5 * 60 && !warned.fiveMin) {
          warned.fiveMin = true;
          toast.error("⚠️ 5 minutes remaining — submit soon.");
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, attemptId]);

  // Tab switch / visibility warning
  useEffect(() => {
    if (!started) return;
    const onVisibility = () => {
      if (document.hidden) {
        setTabWarning(true);
        toast.error("⚠️ Violation detected — tab switch or window minimised. This has been recorded.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [started]);

  const incidents = state.tabSwitches + state.fullscreenExits + state.copyAttempts + state.pasteAttempts + state.devToolsBlocks;
  const trustScore = useMemo(() => Math.max(0, 100 - incidents * 10), [incidents]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const handleStart = async () => {
    await requestFullscreen();
    try {
      const { attempt, questions: qs, answers: existing } = await startOrResumeAttempt(registrationId);
      setAttemptId(attempt.id);
      setQuestions(qs);
      const map: Record<string, ExamAnswer["response"]> = {};
      for (const a of existing) map[a.question_id] = a.response;
      setAnswers(map);
      setStarted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start exam");
    }
  };

  const handleEnd = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      const result = await submitAttempt(attemptId);
      await endSession();
      toast.success(
        result.maxScore > 0
          ? `Submitted · ${result.score}/${result.maxScore}${result.autoScored ? "" : " (pending review)"}`
          : "Exam submitted",
      );
      navigate({ to: "/student" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
      setSubmitting(false);
    }
  };

  const persistAnswer = async (questionId: string, response: ExamAnswer["response"]) => {
    if (!attemptId) return;
    setAnswers((prev) => ({ ...prev, [questionId]: response }));
    try {
      await saveAnswer({ attempt_id: attemptId, question_id: questionId, response });
    } catch (err) {
      toast.error("Could not save answer");
      console.error(err);
    }
  };

  const currentQuestion = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  return (
    <StudentShell>
      {/* Tab-switch violation banner */}
      {tabWarning && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 bg-rose-600 px-5 py-3 text-sm font-medium text-white shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Violation recorded: you left the exam window. Return immediately — further violations may terminate your exam.
          </div>
          <button onClick={() => setTabWarning(false)} className="shrink-0 rounded px-2 py-0.5 hover:bg-rose-700">Dismiss</button>
        </div>
      )}
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{examTitle}</h1>
            <p className="text-xs text-muted-foreground">Proctored session · ID {registrationId.slice(0, 8)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Trust score {trustScore}
            </Badge>
            <Badge
              className={`font-mono tabular-nums ${
                secondsLeft < 300 ? "bg-rose-600 text-white animate-pulse" :
                secondsLeft < 900 ? "bg-amber-500 text-white" :
                "bg-foreground text-background"
              }`}
            >
              {mm}:{ss}
            </Badge>
          </div>
        </div>

        {!started ? (
          <Card className="p-8 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-[color:var(--brand-blue)]" />
            <h2 className="mt-3 text-lg font-semibold">Ready to begin?</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Clicking start will request access to your camera and microphone, switch the page to fullscreen, and begin
              recording proctoring signals.
            </p>
            <Button onClick={handleStart} size="lg" className="mt-5" style={{ background: "var(--gradient-primary)" }}>
              <Maximize2 className="mr-2 h-4 w-4" /> Start exam
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {state.webcamError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Camera unavailable</AlertTitle>
                  <AlertDescription>{state.webcamError}</AlertDescription>
                </Alert>
              )}

              <Card className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {questions.length > 0
                      ? `Question ${currentIdx + 1} of ${questions.length}`
                      : "No questions"}
                  </h3>
                  <Progress value={progress} className="h-1.5 w-32" />
                </div>

                {currentQuestion ? (
                  <QuestionRenderer
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={(r) => persistAnswer(currentQuestion.id, r)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No questions have been added to this exam yet.
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    {currentIdx < questions.length - 1 ? (
                      <Button onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}>
                        Next
                      </Button>
                    ) : (
                      <Button onClick={handleEnd} disabled={submitting}>
                        <X className="mr-2 h-4 w-4" />
                        {submitting ? "Submitting…" : "Submit exam"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <aside className="space-y-4">
              <Card className="overflow-hidden">
                <div className="relative aspect-video bg-black">
                  <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> REC
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 text-xs">
                  <Stat icon={<Camera className="h-3 w-3" />} label="Camera" ok={state.webcamActive} />
                  <Stat icon={<Mic className="h-3 w-3" />} label="Mic" ok={state.micActive} />
                  <Stat
                    icon={
                      state.faceStatus === "multiple" ? <Users className="h-3 w-3" /> :
                      state.faceStatus === "absent" ? <EyeOff className="h-3 w-3" /> :
                      <Eye className="h-3 w-3" />
                    }
                    label={
                      state.faceStatus === "multiple" ? "Multiple faces" :
                      state.faceStatus === "absent" ? "Face absent" :
                      state.faceStatus === "present" ? "Face OK" : "Face"
                    }
                    ok={state.faceStatus === "present"}
                    warn={state.faceStatus === "multiple" || state.faceStatus === "absent"}
                  />
                </div>
              </Card>

              <Card className="p-4 text-xs">
                <h4 className="mb-2 text-sm font-semibold">Live signals</h4>
                <Row label="Tab switches" value={state.tabSwitches} flag={state.tabSwitches > 0} />
                <Row label="Fullscreen exits" value={state.fullscreenExits} flag={state.fullscreenExits > 0} />
                <Row label="Copy attempts" value={state.copyAttempts} flag={state.copyAttempts > 0} />
                <Row label="Paste attempts" value={state.pasteAttempts} flag={state.pasteAttempts > 0} />
                <Row label="Right-clicks blocked" value={state.contextMenuBlocks} />
                <Row label="Dev tool attempts" value={state.devToolsBlocks} flag={state.devToolsBlocks > 0} />
                <Row label="Print attempts" value={state.printBlocks} flag={state.printBlocks > 0} />
              </Card>
            </aside>
          </div>
        )}
      </div>
    </StudentShell>
  );
}

function Stat({ icon, label, ok, warn }: { icon: React.ReactNode; label: string; ok: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-2 py-1">
      <span className="flex items-center gap-1 text-muted-foreground">{icon}{label}</span>
      <span className={ok ? "text-emerald-600" : warn ? "text-amber-600" : "text-muted-foreground"}>
        {ok ? "OK" : warn ? "!" : "Off"}
      </span>
    </div>
  );
}

function Row({ label, value, flag }: { label: string; value: number; flag?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums font-medium ${flag ? "text-amber-600" : ""}`}>{value}</span>
    </div>
  );
}

function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: ExamAnswer["response"] | undefined;
  onChange: (r: ExamAnswer["response"]) => void;
}) {
  if (question.type === "mcq" || question.type === "true_false") {
    const opts = (question.options as unknown as QuestionOption[]) ?? [];
    const selected = (value as { selected?: number } | undefined)?.selected;
    return (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed">{question.prompt || <em>Untitled question</em>}</p>
        <RadioGroup
          value={selected !== undefined ? String(selected) : undefined}
          onValueChange={(v) => onChange({ selected: Number(v) })}
          className="space-y-2"
        >
          {opts.map((opt, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-accent/40"
            >
              <RadioGroupItem id={`opt-${question.id}-${idx}`} value={String(idx)} />
              <Label htmlFor={`opt-${question.id}-${idx}`} className="cursor-pointer text-sm font-normal">
                {opt.text || <span className="text-muted-foreground">Option {idx + 1}</span>}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  }

  // descriptive / coding → textarea
  const text = (value as { text?: string } | undefined)?.text ?? "";
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed">{question.prompt || <em>Untitled question</em>}</p>
      <Textarea
        value={text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Type your answer…"
        rows={question.type === "coding" ? 12 : 6}
        className={question.type === "coding" ? "font-mono text-xs" : ""}
      />
    </div>
  );
}