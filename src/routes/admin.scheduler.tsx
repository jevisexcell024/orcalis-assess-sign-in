import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { listSchedules, createSchedule, countAllRegistrations } from "@/lib/scheduling";
import { listExams } from "@/lib/exams";

export const Route = createFileRoute("/admin/scheduler")({
  component: SchedulerPage,
  head: () => ({ meta: [{ title: "Exam Scheduler · Orcalis Assess" }] }),
});

function SchedulerPage() {
  const qc = useQueryClient();
  const schedulesQ = useQuery({ queryKey: ["schedules"], queryFn: listSchedules });
  const examsQ = useQuery({ queryKey: ["exams"], queryFn: listExams });
  const candidatesQ = useQuery({
    queryKey: ["registrations", "count"],
    queryFn: countAllRegistrations,
  });

  const [examId, setExamId] = useState<string>("");
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [tz, setTz] = useState<string>("America/New_York");
  const [maxConc, setMaxConc] = useState(1500);
  const [waitlist, setWaitlist] = useState(true);
  const [confirm, setConfirm] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [notifyProc, setNotifyProc] = useState(false);
  const [saving, setSaving] = useState(false);

  const scheduled = schedulesQ.data?.length ?? 0;
  const totalCandidates = candidatesQ.data ?? 0;

  const forecast = useMemo(() => {
    const days: { day: string; booked: number; capacity: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const booked = (schedulesQ.data ?? []).filter((s) => {
        const t = new Date(s.start_at).getTime();
        return t >= d.getTime() && t < next.getTime();
      }).length;
      days.push({
        day: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
        booked,
        capacity: maxConc,
      });
    }
    return days;
  }, [schedulesQ.data, maxConc]);

  const peakUse = useMemo(() => {
    const maxBooked = forecast.reduce((m, d) => Math.max(m, d.booked), 0);
    if (!maxConc) return "0%";
    return `${Math.min(100, Math.round((maxBooked / Math.max(1, maxConc)) * 100))}%`;
  }, [forecast, maxConc]);

  const resetForm = () => {
    setExamId("");
    setStartAt("");
    setEndAt("");
  };

  const handleSave = async () => {
    if (!examId) return toast.error("Pick an exam first");
    if (!startAt || !endAt) return toast.error("Set both start and end times");
    if (new Date(endAt) <= new Date(startAt)) return toast.error("End must be after start");
    setSaving(true);
    try {
      await createSchedule({
        exam_id: examId,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        timezone: tz,
        max_concurrent: maxConc,
        waitlist_enabled: waitlist,
        notify_confirmation: confirm,
        notify_reminder: reminder,
        notify_proctors: notifyProc,
      });
      toast.success("Schedule created");
      resetForm();
      await qc.invalidateQueries({ queryKey: ["schedules"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create schedule");
    } finally {
      setSaving(false);
    }
  };

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
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat icon={<CalendarCheck2 className="h-4 w-4" />} label="Scheduled Exams" value={String(scheduled)} tone="bg-sky-500/10 text-sky-600" />
              <Stat icon={<Users2 className="h-4 w-4" />} label="Total Candidates" value={totalCandidates.toLocaleString()} tone="bg-emerald-500/10 text-emerald-600" />
              <Stat icon={<Zap className="h-4 w-4" />} label="Peak Capacity Use" value={peakUse} tone="bg-amber-500/10 text-amber-600" />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold tracking-tight">Upcoming 7 Days</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <LegendDot color="bg-indigo-500" label="Scheduled Sessions" />
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
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
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
              <h3 className="text-sm font-semibold tracking-tight">New Schedule</h3>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Draft</Badge>
            </div>

            <div className="mt-4">
              <Label>Target Exam</Label>
              <select
                className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
              >
                <option value="">Select an exam…</option>
                {(examsQ.data ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Scheduling Window
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start</Label>
                <Input
                  type="datetime-local"
                  className="mt-1 h-9 text-xs"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input
                  type="datetime-local"
                  className="mt-1 h-9 text-xs"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs">Time Zone</Label>
              <div className="relative mt-1">
                <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <select
                  className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-2 text-xs"
                  value={tz}
                  onChange={(e) => setTz(e.target.value)}
                >
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
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
              <Button variant="outline" className="flex-1" onClick={resetForm} disabled={saving}>
                Reset
              </Button>
              <Button
                className="flex-1"
                style={{ background: "var(--gradient-primary)" }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : (<><Plus className="mr-1.5 h-4 w-4" />Create Schedule</>)}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <h3 className="text-sm font-semibold tracking-tight">Upcoming Windows</h3>
            {schedulesQ.data?.length ? (
              <ul className="mt-3 space-y-2 text-xs">
                {schedulesQ.data.slice(0, 5).map((s) => {
                  const examTitle =
                    (s as { exams?: { title?: string } | null }).exams?.title ?? "Exam";
                  return (
                    <li key={s.id} className="flex items-start gap-2 rounded-md border border-border p-2">
                      <Clock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{examTitle}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {new Date(s.start_at).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
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