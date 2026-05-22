import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Bell, CheckCircle2, Code2, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listMyRegistrations } from "@/lib/scheduling";

export const Route = createFileRoute("/student/")({
  component: StudentHub,
  head: () => ({ meta: [{ title: "Student Hub · Orcalis Assess" }] }),
});

type RegRow = {
  id: string;
  status: string;
  system_check_passed: boolean;
  schedule_id: string | null;
  score: number | null;
  created_at: string;
  exams?: { title?: string | null } | null;
  exam_schedules?: { start_at?: string | null; end_at?: string | null; timezone?: string | null } | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso?: string | null) {
  if (!iso) return "TBD";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function StudentHub() {
  const regsQ = useQuery({ queryKey: ["my-regs"], queryFn: listMyRegistrations });
  const regs = (regsQ.data ?? []) as RegRow[];

  const upcoming = regs
    .filter((r) => r.exam_schedules?.start_at && new Date(r.exam_schedules.start_at).getTime() > Date.now())
    .sort(
      (a, b) =>
        new Date(a.exam_schedules!.start_at!).getTime() -
        new Date(b.exam_schedules!.start_at!).getTime(),
    )[0];
  const nextDays = daysUntil(upcoming?.exam_schedules?.start_at);
  const nextLabel =
    nextDays === null
      ? "No upcoming exams scheduled."
      : nextDays <= 0
        ? "Your next exam is live now."
        : `Your next exam is in ${nextDays} day${nextDays === 1 ? "" : "s"}.`;

  const completed = regs.filter((r) => r.status === "completed" && typeof r.score === "number");
  const eligibilityCleared = regs.every((r) => r.status !== "action_required");

  // Performance overview: average score per month over the last 7 months
  const now = new Date();
  const perf = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = completed.filter((r) => {
      const dd = new Date(r.created_at);
      return `${dd.getFullYear()}-${dd.getMonth()}` === key;
    });
    const avg = bucket.length ? bucket.reduce((s, r) => s + (r.score ?? 0), 0) / bucket.length : 0;
    return { m: MONTHS[d.getMonth()], v: Math.round(avg) };
  });

  const recent = completed
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Hub</h1>
            <p className="mt-1 text-sm text-muted-foreground">{nextLabel}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2 shadow-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Registered</p>
              <p className="text-sm font-semibold">{regs.length}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${eligibilityCleared ? "text-emerald-600" : "text-amber-600"}`} />
              <div>
                <p className="text-[11px] text-muted-foreground">Eligibility</p>
                <p className={`text-sm font-semibold ${eligibilityCleared ? "text-emerald-700" : "text-amber-700"}`}>
                  {eligibilityCleared ? "Cleared" : "Action needed"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Performance Overview</h3>
                <Link to="/student" className="text-xs font-semibold text-[color:var(--brand-blue)]">Detailed Report ›</Link>
              </div>
              {completed.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                  Complete an exam to see your score trend appear here.
                </p>
              ) : (
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf}>
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Bar dataKey="v" fill="oklch(0.58 0.22 262)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              )}
            </section>

            <section>
              <h3 className="text-base font-semibold">Registered Exams</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                {regs.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">
                    You haven't registered for any exams yet. New sessions will appear here as soon as they're published.
                  </div>
                ) : (
                  regs.map((r) => (
                    <ExamCard
                      key={r.id}
                      title={r.exams?.title ?? "Exam"}
                      sub={r.system_check_passed ? "Ready" : "System Check Pending"}
                      date={formatDate(r.exam_schedules?.start_at)}
                      status={r.status}
                      tone={r.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}
                      icon={<Code2 className="h-4 w-4" />}
                      cta={r.status === "action_required" ? "Check Setup" : undefined}
                      to={`/student/exams/${r.id}/checkin`}
                    />
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search exams…" className="h-10 rounded-full bg-muted/40 pl-10" />
              </div>
              <button className="rounded-full border border-border p-2.5 text-muted-foreground hover:bg-muted">
                <Bell className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl p-5 text-white shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4" />
                <h4 className="text-sm font-semibold">System Compatibility</h4>
              </div>
              <p className="mt-2 text-xs text-white/85">
                Run a quick AI proctoring system check before your next exam.
              </p>
              <Button variant="secondary" className="mt-3 h-8 bg-white text-foreground hover:bg-white/90">Run Check</Button>
            </div>

            <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Recent Results</h4>
                <button className="text-xs text-muted-foreground">View all ⌄</button>
              </div>
              {recent.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Your completed exam scores will appear here.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {recent.map((r) => {
                    const d = new Date(r.created_at);
                    const label = `${MONTHS[d.getMonth()].toUpperCase()} ${d.getDate()}`;
                    return (
                      <ResultRow
                        key={r.id}
                        date={label}
                        title={r.exams?.title ?? "Exam"}
                        sub={(r.score ?? 0) >= 60 ? "Passed" : "Below passing"}
                        score={`${r.score}%`}
                      />
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </StudentShell>
  );
}

function ExamCard({
  title, sub, date, status, tone, icon, cta, to,
}: { title: string; sub: string; date: string; status: string; tone: string; icon: React.ReactNode; cta?: string; to?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <Badge className={`${tone} hover:${tone}`}>{status}</Badge>
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">{icon}</span>
      </div>
      <p className="mt-3 text-base font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">📅 {date}</span>
        {cta ? (
          to ? <Link to={to}><Button size="sm" className="h-8 bg-amber-500 text-white hover:bg-amber-600">{cta}</Button></Link>
             : <Button size="sm" className="h-8 bg-amber-500 text-white hover:bg-amber-600">{cta}</Button>
        ) : (
          to ? <Link to={to}><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
             : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

function ResultRow({ date, title, sub, score }: { date: string; title: string; sub: string; score: string }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border p-2.5">
      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-muted text-[10px] font-semibold">
        <span>{date.split(" ")[0]}</span>
        <span className="text-sm">{date.split(" ")[1]}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <span className="text-sm font-semibold text-emerald-600">{score}</span>
    </li>
  );
}