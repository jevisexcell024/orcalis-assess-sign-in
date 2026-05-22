import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarCheck2,
  Clock,
  Globe2,
  Plus,
  Search,
  Users2,
  Zap,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { listSchedules } from "@/lib/scheduling";
import { listExams } from "@/lib/exams";

export const Route = createFileRoute("/admin/scheduler")({
  component: SchedulerPage,
  head: () => ({ meta: [{ title: "Exam Scheduler · Orcalis Assess" }] }),
});

const forecast = Array.from({ length: 7 }, (_, i) => ({
  day: ["Mon 10", "Tue 11", "Wed 12", "Thu 13", "Fri 14", "Sat 15", "Sun 16"][i],
  booked: [1200, 1700, 2300, 2100, 1500, 900, 500][i],
  capacity: 3000,
}));

function SchedulerPage() {
  const schedulesQ = useQuery({ queryKey: ["schedules"], queryFn: listSchedules });
  const examsQ = useQuery({ queryKey: ["exams"], queryFn: listExams });
  const [maxConc, setMaxConc] = useState(1500);
  const [waitlist, setWaitlist] = useState(true);
  const [confirm, setConfirm] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [notifyProc, setNotifyProc] = useState(false);

  const scheduled = schedulesQ.data?.length ?? 0;

  return (
    <AdminShell
      title="Exam Scheduler"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Scheduler" }]}
      actions={
        <>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search exams, candidates, or dates…" className="h-9 pl-9" />
          </div>
          <Button className="ml-auto h-9" style={{ background: "var(--gradient-primary)" }}>
            <Plus className="mr-1.5 h-4 w-4" /> New Schedule
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold tracking-tight">Scheduling Overview</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Manage capacities and active windows for upcoming examinations.
                </p>
              </div>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option>Current Month</option>
                <option>Next Month</option>
              </select>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat icon={<CalendarCheck2 className="h-4 w-4" />} label="Scheduled Exams" value={String(scheduled || "142")} tone="bg-sky-500/10 text-sky-600" />
              <Stat icon={<Users2 className="h-4 w-4" />} label="Total Candidates" value="8,450" tone="bg-emerald-500/10 text-emerald-600" />
              <Stat icon={<Zap className="h-4 w-4" />} label="Peak Capacity Use" value="85%" tone="bg-amber-500/10 text-amber-600" />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold tracking-tight">Capacity Forecasting</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <LegendDot color="bg-indigo-500" label="Booked" />
                <LegendDot color="bg-slate-400" label="Available" />
              </div>
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.58 0.22 262)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.58 0.22 262)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 260)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="booked" stroke="oklch(0.58 0.22 262)" strokeWidth={2} fill="url(#cap)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight">Capacity & Access Controls</h3>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
            </div>

            <div className="mt-4">
              <Label>Target Exam</Label>
              <select className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {examsQ.data?.length
                  ? examsQ.data.map((e) => <option key={e.id}>{e.title}</option>)
                  : <option>CS101 Final Exam</option>}
              </select>
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Scheduling Window
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start</Label>
                <Input type="datetime-local" className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input type="datetime-local" className="mt-1 h-9 text-xs" />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs">Time Zone</Label>
              <div className="relative mt-1">
                <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <select className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-2 text-xs">
                  <option>America/New_York (EST)</option>
                  <option>Europe/London (GMT)</option>
                </select>
              </div>
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Concurrency Limits
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Max Simultaneous Users</span>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">{maxConc.toLocaleString()}</span>
            </div>
            <Slider min={100} max={5000} step={50} value={[maxConc]} onValueChange={(v) => setMaxConc(v[0])} className="mt-2" />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>100</span><span>5,000</span>
            </div>

            <div className="mt-4 flex items-start justify-between rounded-lg bg-muted/40 p-3">
              <div>
                <p className="text-xs font-medium">Enable Waitlist</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">If capacity is reached</p>
              </div>
              <Switch checked={waitlist} onCheckedChange={setWaitlist} />
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Automated Notifications
            </p>
            <div className="mt-2 space-y-2">
              <NotifyRow checked={confirm} onChange={setConfirm} label="Send confirmation email to candidates" />
              <NotifyRow checked={reminder} onChange={setReminder} label="24hr reminder before exam window" />
              <NotifyRow checked={notifyProc} onChange={setNotifyProc} label="Notify proctors on schedule change" />
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1">Cancel</Button>
              <Button className="flex-1" style={{ background: "var(--gradient-primary)" }}>Save Rules</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <h3 className="text-sm font-semibold tracking-tight">Upcoming Windows</h3>
            {schedulesQ.data?.length ? (
              <ul className="mt-3 space-y-2 text-xs">
                {schedulesQ.data.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-md border border-border p-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{new Date(s.start_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No schedules yet. Create one above.</p>
            )}
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-[11px] font-medium text-muted-foreground ${className ?? ""}`}>{children}</label>;
}

function NotifyRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <span>{label}</span>
    </label>
  );
}