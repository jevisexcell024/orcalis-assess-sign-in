import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Camera, Maximize2, Mic, ShieldCheck, X } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProctoring } from "@/lib/proctoring";
import { getSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [secondsLeft, setSecondsLeft] = useState(60 * 60); // 60-min default
  const [examTitle, setExamTitle] = useState("Live Exam");

  const { videoRef, state, requestFullscreen, endSession } = useProctoring(
    started ? registrationId : null,
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("exam_registrations")
        .select("exam_id, exams:exam_id(title)")
        .eq("id", registrationId)
        .maybeSingle();
      const title = (data as unknown as { exams?: { title?: string } } | null)?.exams?.title;
      if (title) setExamTitle(title);
    })();
  }, [registrationId]);

  // Countdown timer
  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [started]);

  const incidents = state.tabSwitches + state.fullscreenExits + state.copyAttempts + state.pasteAttempts;
  const trustScore = useMemo(() => Math.max(0, 100 - incidents * 10), [incidents]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const handleStart = async () => {
    await requestFullscreen();
    setStarted(true);
  };

  const handleEnd = async () => {
    await endSession();
    toast.success("Exam submitted");
    navigate({ to: "/student" });
  };

  return (
    <StudentShell>
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
            <Badge className="bg-foreground text-background font-mono tabular-nums">{mm}:{ss}</Badge>
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
                  <h3 className="text-sm font-semibold">Question 1 of 1</h3>
                  <Progress value={5} className="h-1.5 w-32" />
                </div>
                <p className="text-sm leading-relaxed">
                  This is a placeholder question. The proctoring engine is fully live — try switching tabs, exiting
                  fullscreen, copying text, or right-clicking. Every event is recorded to the database in real time.
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={handleEnd}>
                    <X className="mr-2 h-4 w-4" /> End session
                  </Button>
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
                </div>
              </Card>

              <Card className="p-4 text-xs">
                <h4 className="mb-2 text-sm font-semibold">Live signals</h4>
                <Row label="Tab switches" value={state.tabSwitches} flag={state.tabSwitches > 0} />
                <Row label="Fullscreen exits" value={state.fullscreenExits} flag={state.fullscreenExits > 0} />
                <Row label="Copy attempts" value={state.copyAttempts} flag={state.copyAttempts > 0} />
                <Row label="Paste attempts" value={state.pasteAttempts} flag={state.pasteAttempts > 0} />
                <Row label="Right-clicks blocked" value={state.contextMenuBlocks} />
              </Card>
            </aside>
          </div>
        )}
      </div>
    </StudentShell>
  );
}

function Stat({ icon, label, ok }: { icon: React.ReactNode; label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-2 py-1">
      <span className="flex items-center gap-1 text-muted-foreground">{icon}{label}</span>
      <span className={ok ? "text-emerald-600" : "text-muted-foreground"}>{ok ? "Live" : "Off"}</span>
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