import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Bell, CheckCircle2, Database, Code2, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listMyRegistrations } from "@/lib/scheduling";

export const Route = createFileRoute("/student/")({
  component: StudentHub,
  head: () => ({ meta: [{ title: "Student Hub · Orcalis Assess" }] }),
});

const perf = [
  { m: "Jan", v: 4 }, { m: "Feb", v: 5 }, { m: "Mar", v: 6 }, { m: "Apr", v: 8 },
  { m: "May", v: 5 }, { m: "Jun", v: 6 }, { m: "Jul", v: 4 },
];

function StudentHub() {
  const regsQ = useQuery({ queryKey: ["my-regs"], queryFn: listMyRegistrations });
  const regs = regsQ.data ?? [];

  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Hub</h1>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back, your next exam is in 3 days.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2 shadow-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Credits</p>
              <p className="text-sm font-semibold">1,250</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-[11px] text-muted-foreground">Eligibility</p>
                <p className="text-sm font-semibold text-emerald-700">Cleared</p>
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
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf}>
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Bar dataKey="v" fill="oklch(0.58 0.22 262)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <h3 className="text-base font-semibold">Registered Exams</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                {regs.length === 0 ? (
                  <>
                    <ExamCard title="Software Engineering II" sub="Proctored · 120 mins" date="Oct 24, 2024" status="Confirmed" tone="bg-emerald-100 text-emerald-700" icon={<Code2 className="h-4 w-4" />} />
                    <ExamCard title="Database Architecture" sub="System Check Pending" date="Oct 28, 2024" status="Action Required" tone="bg-amber-100 text-amber-700" icon={<Database className="h-4 w-4" />} cta="Check Setup" />
                  </>
                ) : (
                  regs.map((r) => (
                    <ExamCard
                      key={r.id}
                      title={(r as { exams?: { title?: string } }).exams?.title ?? "Exam"}
                      sub={r.system_check_passed ? "Ready" : "System Check Pending"}
                      date={r.schedule_id ? "Scheduled" : "TBD"}
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
              <ul className="mt-3 space-y-2">
                <ResultRow date="OCT 12" title="Cloud Computing Basics" sub="Certificate Available" score="92%" />
                <ResultRow date="SEP 28" title="Network Security" sub="Practice Test" score="78%" />
              </ul>
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