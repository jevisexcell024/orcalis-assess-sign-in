import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Camera, Mic, Monitor, Wifi, CheckCircle2, AlertTriangle,
  ShieldAlert, FileText, Clock, BanIcon, Eye, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StudentShell } from "@/components/student/StudentShell";
import { supabase } from "@/integrations/supabase/client";
import { updateRegistration } from "@/lib/scheduling";
import { getSession } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const NAVY = "oklch(0.385 0.12 247)";

// ─── Rules & Protocols data ────────────────────────────────────────────────

const EXAM_RULES = [
  {
    icon: Eye,
    title: "Continuous AI Proctoring",
    body: "Your webcam, microphone, and screen activity are recorded throughout the exam. Ensure your face is fully visible and well-lit at all times.",
    severity: "required",
  },
  {
    icon: BanIcon,
    title: "No External Resources",
    body: "Textbooks, notes, mobile phones, smartwatches, earphones, secondary monitors, and any form of printed material are strictly prohibited.",
    severity: "required",
  },
  {
    icon: Monitor,
    title: "Single Window / Tab Only",
    body: "You must remain on the exam window at all times. Switching tabs, minimising the browser, or opening new applications will be automatically flagged.",
    severity: "required",
  },
  {
    icon: Clock,
    title: "Time Limits Are Strictly Enforced",
    body: "The exam will auto-submit when time expires. Partial answers will be saved. You will not receive extra time under any circumstances.",
    severity: "info",
  },
  {
    icon: Camera,
    title: "No Other Persons in Frame",
    body: "Only the registered candidate may be visible on camera. Detection of additional persons will result in an immediate proctoring violation flag.",
    severity: "required",
  },
  {
    icon: ShieldAlert,
    title: "Violation Consequences",
    body: "Three or more flagged violations will result in automatic exam termination and review by the academic integrity board. Results may be withheld.",
    severity: "warning",
  },
];

const INTEGRITY_ITEMS = [
  "I will not communicate with or receive assistance from any person during the exam.",
  "I will not use AI tools, answer generators, or any software other than this exam platform.",
  "I understand that all my answers will be submitted as my own original work.",
  "I accept that violations will be reviewed and may result in disqualification.",
];

// ─── Page ─────────────────────────────────────────────────────────────────

function CheckinPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  // step 1 = Rules & Integrity, 2 = System Check, 3 = Identity
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [integrityChecks, setIntegrityChecks] = useState<boolean[]>(
    INTEGRITY_ITEMS.map(() => false),
  );
  const [capturing, setCapturing] = useState(false);
  const [systemChecks, setSystemChecks] = useState({
    camera: false,
    mic: false,
    network: false,
    screen: false,
  });

  const allIntegrityAgreed = integrityChecks.every(Boolean);
  const allSystemReady = Object.values(systemChecks).every(Boolean);

  const { data: reg, isLoading, error } = useQuery({
    queryKey: ["student", "checkin", id],
    queryFn: () => fetchRegistration(id),
  });

  const exam = (reg as any)?.exams;
  const schedule = (reg as any)?.exam_schedules;
  const durationMin = schedule?.duration_minutes ?? 60;
  const examTitle = exam?.title ?? "Loading…";
  const examTerm = exam?.term ?? "";

  const steps = [
    { n: 1, label: "Rules & Integrity" },
    { n: 2, label: "System Check" },
    { n: 3, label: "Identity Verification" },
  ];

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
      <div className="mx-auto w-full max-w-[960px] space-y-6">

        {/* Header */}
        <div className="rounded-xl border border-[oklch(0.90_0.01_252)] bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.50_0.04_252)]">
                Pre-exam Check-in
              </p>
              <h1 className="mt-1 text-xl font-bold text-[oklch(0.12_0.03_260)]">
                {isLoading ? <span className="inline-block h-6 w-56 animate-pulse rounded bg-muted" /> : examTitle}
              </h1>
              {examTerm && <p className="mt-0.5 text-sm text-[oklch(0.50_0.04_252)]">{examTerm} · {durationMin} min</p>}
            </div>

            {/* Step indicator */}
            <ol className="flex items-center gap-2">
              {steps.map((s, i) => (
                <li key={s.n} className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                    step > s.n
                      ? "bg-emerald-500 text-white"
                      : step === s.n
                        ? "text-white"
                        : "bg-[oklch(0.93_0.01_252)] text-[oklch(0.55_0.04_252)]",
                  )} style={step === s.n ? { backgroundColor: NAVY } : undefined}>
                    {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                  </div>
                  <span className={cn(
                    "hidden text-xs font-medium sm:block",
                    step === s.n ? "text-[oklch(0.12_0.03_260)]" : "text-[oklch(0.55_0.04_252)]",
                  )}>{s.label}</span>
                  {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-[oklch(0.70_0.02_252)]" />}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Step 1: Rules & Academic Integrity ── */}
        {step === 1 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              {/* Rules */}
              <section className="rounded-xl border border-[oklch(0.90_0.01_252)] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-[oklch(0.385_0.12_247)]" />
                  <h2 className="text-base font-semibold text-[oklch(0.12_0.03_260)]">Examination Rules</h2>
                </div>
                <div className="space-y-4">
                  {EXAM_RULES.map((rule) => (
                    <div key={rule.title} className={cn(
                      "flex gap-3 rounded-lg border p-4",
                      rule.severity === "warning"
                        ? "border-rose-200 bg-rose-50"
                        : rule.severity === "required"
                          ? "border-[oklch(0.88_0.02_252)] bg-[oklch(0.97_0.005_252)]"
                          : "border-amber-200 bg-amber-50",
                    )}>
                      <rule.icon className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        rule.severity === "warning" ? "text-rose-500" :
                        rule.severity === "info" ? "text-amber-600" :
                        "text-[oklch(0.385_0.12_247)]",
                      )} />
                      <div>
                        <p className="text-[13px] font-semibold text-[oklch(0.15_0.03_260)]">{rule.title}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[oklch(0.40_0.04_255)]">{rule.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Academic Integrity Pledge */}
              <section className="rounded-xl border border-[oklch(0.90_0.01_252)] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="h-4 w-4 text-[oklch(0.385_0.12_247)]" />
                  <h2 className="text-base font-semibold text-[oklch(0.12_0.03_260)]">Academic Integrity Pledge</h2>
                </div>
                <p className="mb-4 text-[12px] text-[oklch(0.50_0.04_252)]">
                  You must acknowledge each statement below before proceeding. This constitutes a legally binding declaration.
                </p>
                <div className="space-y-3">
                  {INTEGRITY_ITEMS.map((item, i) => (
                    <label key={i} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[oklch(0.90_0.01_252)] p-3.5 transition hover:bg-[oklch(0.975_0.004_252)]">
                      <Checkbox
                        checked={integrityChecks[i]}
                        onCheckedChange={(v) =>
                          setIntegrityChecks((prev) => {
                            const n = [...prev];
                            n[i] = !!v;
                            return n;
                          })
                        }
                        className="mt-0.5 shrink-0"
                      />
                      <span className="text-[13px] leading-relaxed text-[oklch(0.25_0.04_260)]">{item}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar summary */}
            <aside className="space-y-4">
              <div className="rounded-xl border border-[oklch(0.90_0.01_252)] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[oklch(0.12_0.03_260)] mb-3">Exam Summary</h3>
                <dl className="space-y-2 text-[12px]">
                  {[
                    { label: "Exam", val: examTitle },
                    { label: "Term", val: examTerm || "—" },
                    { label: "Duration", val: `${durationMin} minutes` },
                    { label: "Proctoring", val: "AI-monitored (camera + mic + screen)" },
                    { label: "Auto-submit", val: "Yes — when timer expires" },
                    { label: "Violations allowed", val: "Up to 2 (3rd = termination)" },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between gap-2">
                      <dt className="text-[oklch(0.55_0.04_252)]">{label}</dt>
                      <dd className="text-right font-medium text-[oklch(0.20_0.04_260)]">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-600 mb-2">Important</p>
                <p className="text-[12px] leading-relaxed text-rose-700">
                  Once the exam begins, you cannot pause or restart. Ensure your environment is quiet, your camera is unobstructed, and your device is fully charged.
                </p>
              </div>

              <Button
                className="w-full h-11 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
                disabled={!allIntegrityAgreed}
                onClick={() => setStep(2)}
              >
                {allIntegrityAgreed ? "Proceed to System Check →" : `Acknowledge all ${INTEGRITY_ITEMS.length} statements to continue`}
              </Button>
            </aside>
          </div>
        )}

        {/* ── Step 2: System Check ── */}
        {step === 2 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            <section className="rounded-xl border border-[oklch(0.90_0.01_252)] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="h-4 w-4 text-[oklch(0.385_0.12_247)]" />
                <h2 className="text-base font-semibold text-[oklch(0.12_0.03_260)]">System Readiness</h2>
              </div>
              <p className="mb-5 text-[13px] text-[oklch(0.50_0.04_252)]">
                Each requirement below must be verified before you can start the exam. Grant browser permissions when prompted.
              </p>
              <ul className="space-y-3">
                {[
                  { key: "camera" as const, icon: Camera, label: "Webcam", sub: "Required for face monitoring", action: "Test Camera" },
                  { key: "mic"    as const, icon: Mic,    label: "Microphone", sub: "Required for audio monitoring", action: "Test Mic" },
                  { key: "network"as const, icon: Wifi,   label: "Network", sub: "Minimum 2 Mbps required", action: "Run Speed Test" },
                  { key: "screen" as const, icon: Monitor, label: "Screen Sharing", sub: "Full-screen capture required", action: "Share Screen" },
                ].map(({ key, icon: Icon, label, sub, action }) => (
                  <li key={key} className="flex items-center gap-3 rounded-lg border border-[oklch(0.90_0.01_252)] p-4">
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white transition-all",
                      systemChecks[key] ? "bg-emerald-500" : "bg-[oklch(0.93_0.01_252)]",
                    )}>
                      {systemChecks[key]
                        ? <CheckCircle2 className="h-4 w-4 text-white" />
                        : <Icon className="h-4 w-4 text-[oklch(0.55_0.04_252)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[oklch(0.15_0.03_260)]">{label}</p>
                      <p className="text-[11px] text-[oklch(0.55_0.04_252)]">{sub}</p>
                    </div>
                    {systemChecks[key] ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Verified</span>
                    ) : (
                      <button
                        onClick={() => setSystemChecks((prev) => ({ ...prev, [key]: true }))}
                        className="rounded-md border border-[oklch(0.90_0.01_252)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.25_0.04_260)] transition hover:bg-[oklch(0.96_0.005_252)]"
                      >
                        {action}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <aside className="space-y-4">
              <div className="rounded-xl border border-[oklch(0.90_0.01_252)] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[oklch(0.12_0.03_260)] mb-3">Environment Checklist</h3>
                <ul className="space-y-2.5 text-[12px] text-[oklch(0.40_0.04_255)]">
                  {[
                    "Room is quiet and free from distractions",
                    "Desk is clear of unauthorised materials",
                    "Good, consistent lighting on your face",
                    "Stable internet connection (wired preferred)",
                    "Laptop/device is plugged in or fully charged",
                    "No other applications are running",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                className="w-full h-11 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
                disabled={!allSystemReady}
                onClick={async () => {
                  try { await updateRegistration(id, { system_check_passed: true }); } catch {}
                  setStep(3);
                }}
              >
                {allSystemReady ? "Proceed to Identity Check →" : "Complete all checks to continue"}
              </Button>
              <button
                className="w-full text-center text-[12px] text-[oklch(0.55_0.04_252)] underline-offset-2 hover:underline"
                onClick={() => setStep(1)}
              >
                ← Back to rules
              </button>
            </aside>
          </div>
        )}

        {/* ── Step 3: Identity Verification ── */}
        {step === 3 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            <section className="rounded-xl border border-[oklch(0.90_0.01_252)] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-4 w-4 text-[oklch(0.385_0.12_247)]" />
                <h2 className="text-base font-semibold text-[oklch(0.12_0.03_260)]">Identity Verification</h2>
              </div>
              <p className="mb-5 text-[13px] text-[oklch(0.50_0.04_252)]">
                Hold your government-issued ID or student card up to the camera. The AI system will verify your identity before the exam begins.
              </p>

              <div className="rounded-xl border-2 border-dashed border-[oklch(0.88_0.02_252)] bg-[oklch(0.975_0.004_252)] p-10 text-center">
                <Camera className="mx-auto h-10 w-10 text-[oklch(0.55_0.04_252)]" />
                <p className="mt-3 text-sm font-semibold text-[oklch(0.20_0.04_260)]">Position your ID within the camera frame</p>
                <p className="mt-1 text-[12px] text-[oklch(0.55_0.04_252)]">Ensure all four corners of the document are visible and legible.</p>
              </div>

              <div className="mt-4 space-y-2 text-[12px] text-[oklch(0.40_0.04_255)]">
                {[
                  "Accepted: Government ID, passport, student card, driver's licence",
                  "ID must be current and not expired",
                  "Name on ID must match your registered name",
                  "Photo on ID must clearly match your live camera feed",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[oklch(0.385_0.12_247)]" />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 mb-2">Last Step</p>
                <p className="text-[12px] leading-relaxed text-amber-800">
                  After identity is verified, your exam will begin immediately. Make sure you are ready — the countdown timer starts at launch.
                </p>
              </div>

              <Button
                className="w-full h-11 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
                disabled={capturing}
                onClick={async () => {
                  setCapturing(true);
                  try {
                    await updateRegistration(id, { identity_verified: true, status: "confirmed" });
                    toast.success("Identity verified — launching exam…");
                    navigate({ to: "/student/exams/$id/session", params: { id } });
                  } catch {
                    toast.error("Could not save verification — please try again.");
                  } finally {
                    setCapturing(false);
                  }
                }}
              >
                {capturing ? "Verifying…" : "Verify & Start Exam →"}
              </Button>
              <button
                className="w-full text-center text-[12px] text-[oklch(0.55_0.04_252)] underline-offset-2 hover:underline"
                onClick={() => setStep(2)}
              >
                ← Back to system check
              </button>
            </aside>
          </div>
        )}

      </div>
    </StudentShell>
  );
}
