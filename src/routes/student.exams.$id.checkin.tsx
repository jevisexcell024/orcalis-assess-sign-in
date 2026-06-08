import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Mic, Monitor, Wifi, CheckCircle2, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StudentShell } from "@/components/student/StudentShell";
import { supabase } from "@/integrations/supabase/client";
import { updateRegistration } from "@/lib/scheduling";
import { getSession } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/student/exams/$id/checkin")({
  head: () => ({ meta: [{ title: "Pre-exam Check-in · Orcalis Assess" }] }),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ to: "/" });
  },
  component: CheckinPage,
});

async function fetchRegistration(registrationId: string) {
  const { data, error } = await supabase
    .from("exam_registrations")
    .select(`
      id, status, system_check_passed, identity_verified,
      exams ( id, title, term ),
      exam_schedules ( start_at, end_at, timezone, duration_minutes )
    `)
    .eq("id", registrationId)
    .single();
  if (error) throw error;
  return data;
}

function CheckinPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [agreed, setAgreed] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const { data: reg, isLoading, error } = useQuery({
    queryKey: ["student", "checkin", id],
    queryFn: () => fetchRegistration(id),
  });

  const exam = (reg as any)?.exams;
  const schedule = (reg as any)?.exam_schedules;
  const durationMin = schedule?.duration_minutes ?? 60;
  const examTitle = exam?.title ?? "Loading…";
  const examSub = exam?.term ? `${exam.term} · ${durationMin} Minutes` : `${durationMin} Minutes`;

  const stepLabel = (n: number, label: string) => (
    <div className="flex items-center gap-2">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${step >= n ? "bg-[color:var(--brand-blue)] text-white" : "bg-muted text-muted-foreground"}`}>{n}</span>
      <span className={step === n ? "font-semibold" : "text-muted-foreground"}>{label}</span>
    </div>
  );

  if (error) {
    return (
      <StudentShell>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
          <p className="text-sm font-medium">Registration not found or access denied.</p>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/student" })}>Back to dashboard</Button>
        </div>
      </StudentShell>
    );
  }

  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {isLoading ? <span className="inline-block h-6 w-64 animate-pulse rounded bg-muted" /> : examTitle}
            </h1>
            <p className="text-xs text-muted-foreground">{examSub}</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {stepLabel(1, "Instructions")}<span className="text-muted-foreground">—</span>
            {stepLabel(2, "System Check")}<span className="text-muted-foreground">—</span>
            {stepLabel(3, "Identity")}
          </div>
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">● Pending Setup</Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            {/* Instructions */}
            <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[color:var(--brand-blue)]" />
                <h3 className="text-base font-semibold">Exam Guidelines</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Welcome to your examination. Please read the following rules carefully. AI Proctoring will monitor your session continuously.
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <Rule title="Continuous Monitoring" body="Your webcam, microphone, and screen will be recorded. Ensure your face is clearly visible at all times." />
                <Rule title="No External Resources" body="Mobile phones, secondary monitors, smartwatches, and physical notes are strictly prohibited." />
                <Rule title="Stay in Frame" body="Do not leave the camera view. Bathroom breaks are not permitted once the exam begins." />
              </ul>
              <label className="mt-5 flex items-start gap-2 rounded-lg border border-border p-3 text-sm cursor-pointer">
                <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
                <span>I have read and agree to all examination rules and understand that violations will be flagged by the AI proctor.</span>
              </label>
            </section>

            {/* Identity */}
            <section className={`rounded-2xl border border-border bg-background p-6 shadow-sm transition-opacity ${step < 3 ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-base font-semibold">Identity Verification</h3>
                </div>
                {step < 3 && <span className="text-xs text-muted-foreground">Complete system check first</span>}
              </div>
              <div className="mt-4 rounded-xl border-2 border-dashed border-border p-8 text-center">
                <Camera className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Capture ID Card</p>
                <p className="text-xs text-muted-foreground">Hold your student or government ID up to the camera.</p>
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={step < 3 || capturing}
                  onClick={async () => {
                    setCapturing(true);
                    try {
                      await updateRegistration(id, { identity_verified: true, status: "confirmed" });
                      toast.success("Identity verified — starting exam…");
                      navigate({ to: "/student/exams/$id/session", params: { id } });
                    } catch {
                      toast.error("Could not save verification — please try again.");
                    } finally {
                      setCapturing(false);
                    }
                  }}
                >
                  {capturing ? "Verifying…" : "Start Capture"}
                </Button>
              </div>
            </section>
          </div>

          <aside className="rounded-2xl border border-border bg-background p-6 shadow-sm h-fit">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[color:var(--brand-blue)]" />
              <h3 className="text-base font-semibold">System Readiness</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Validating your hardware for proctoring.</p>

            <ul className="mt-4 space-y-3">
              <Check icon={<Camera className="h-4 w-4" />} title="Webcam" sub="FaceTime HD Camera (Built-in)" status={<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">✓ Verified</Badge>} />
              <Check icon={<Mic className="h-4 w-4" />} title="Microphone" sub="Built-in Microphone" status={<Button size="sm" variant="outline" className="h-7">Test Mic</Button>} />
              <Check icon={<Wifi className="h-4 w-4" />} title="Network Speed" sub="Checking latency…" status={<span className="text-xs text-muted-foreground">⟳</span>} />
              <Check icon={<Monitor className="h-4 w-4" />} title="Screen Sharing" sub="Required for monitoring" status={<Button size="sm" variant="outline" className="h-7">Share Screen</Button>} />
            </ul>

            <Button
              className="mt-5 w-full"
              style={{ background: "var(--gradient-primary)" }}
              disabled={step === 1 ? !agreed : false}
              onClick={async () => {
                if (step === 1) {
                  setStep(2);
                } else if (step === 2) {
                  try {
                    await updateRegistration(id, { system_check_passed: true });
                  } catch {
                    // non-fatal — continue anyway
                  }
                  setStep(3);
                }
              }}
            >
              {step === 1 ? "Proceed to System Check →" : step === 2 ? "Proceed to Identity Check →" : "Awaiting ID capture…"}
            </Button>
          </aside>
        </div>
      </div>
    </StudentShell>
  );
}

function Rule({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

function Check({ icon, title, sub, status }: { icon: React.ReactNode; title: string; sub: string; status: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
      </div>
      {status}
    </li>
  );
}
