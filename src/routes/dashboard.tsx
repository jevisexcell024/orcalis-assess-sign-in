import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarClock,
  Database,
  Filter,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard · Orcalis Assess" },
      {
        name: "description",
        content:
          "Institution overview — monitor examination activity, candidate performance, proctoring alerts, and system health on Orcalis Assess.",
      },
    ],
  }),
});

const navOverview = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Candidates", icon: UsersRound },
];

const navManagement = [
  { label: "Upcoming Exams", icon: CalendarClock },
  { label: "Invigilators", icon: Shield },
  { label: "Analytics", icon: BarChart3 },
];

const navSystem = [
  { label: "Storage & Usage", icon: HardDrive },
  { label: "Settings", icon: Settings },
];

const metrics = [
  {
    label: "Enrolled Candidates",
    value: "12,450",
    delta: "+8.2%",
    trend: "up" as const,
    icon: Users,
    tone: "bg-sky-500/10 text-sky-600",
  },
  {
    label: "Active Exams Today",
    value: "48",
    sub: "Across 12 modules",
    icon: Activity,
    tone: "bg-violet-500/10 text-violet-600",
  },
  {
    label: "Proctoring Alerts",
    value: "156",
    delta: "+12",
    trend: "down" as const,
    icon: AlertTriangle,
    tone: "bg-amber-500/10 text-amber-600",
  },
  {
    label: "Storage Usage",
    value: "4.2 TB",
    sub: "of 5 TB",
    progress: 84,
    icon: Database,
    tone: "bg-emerald-500/10 text-emerald-600",
  },
];

const passFailData = [
  { month: "Jan", pass: 78, fail: 22 },
  { month: "Feb", pass: 81, fail: 19 },
  { month: "Mar", pass: 76, fail: 24 },
  { month: "Apr", pass: 84, fail: 16 },
  { month: "May", pass: 88, fail: 12 },
  { month: "Jun", pass: 86, fail: 14 },
  { month: "Jul", pass: 91, fail: 9 },
  { month: "Aug", pass: 89, fail: 11 },
];

const bandwidthData = Array.from({ length: 24 }, (_, i) => ({
  t: i,
  mbps: 600 + Math.round(Math.sin(i / 2) * 220 + Math.random() * 180),
}));

const upcomingExams = [
  {
    title: "Advanced Calculus",
    code: "MAT301",
    dept: "Mathematics Dept.",
    time: "10:00 AM",
    when: "Today, 2h duration",
    candidates: 245,
    status: "Starting Soon",
    statusTone: "bg-amber-100 text-amber-700 ring-amber-200",
  },
  {
    title: "Intro to Psychology",
    code: "PSY101",
    dept: "Social Sciences",
    time: "02:00 PM",
    when: "Today, 1.5h duration",
    candidates: 412,
    status: "Scheduled",
    statusTone: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  {
    title: "Data Structures",
    code: "CS202",
    dept: "Computer Science",
    time: "09:00 AM",
    when: "Tomorrow, 3h duration",
    candidates: 128,
    status: "Scheduled",
    statusTone: "bg-slate-100 text-slate-700 ring-slate-200",
  },
];

const invigilators = [
  {
    name: "Dr. Alan Chen",
    role: "Senior Proctor",
    exam: "MAT301",
    room: "Room A-Virtual",
    ratio: "1:25",
    status: "Active",
    statusTone: "text-emerald-600",
    dot: "bg-emerald-500",
    initials: "AC",
    avatar: "from-sky-400 to-indigo-500",
  },
  {
    name: "Maria Garcia",
    role: "External Invigilator",
    exam: "PSY101",
    room: "Room B-Virtual",
    ratio: "1:30",
    status: "Standby",
    statusTone: "text-amber-600",
    dot: "bg-amber-500",
    initials: "MG",
    avatar: "from-rose-400 to-orange-400",
  },
  {
    name: "James Doe",
    role: "TA Proctor",
    exam: "Unassigned",
    room: "—",
    ratio: "—",
    status: "Offline",
    statusTone: "text-muted-foreground",
    dot: "bg-slate-400",
    initials: "JD",
    avatar: "from-slate-400 to-slate-600",
  },
];

function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen bg-[oklch(0.985_0.005_260)]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Orcalis Assess</span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pt-2">
          <SidebarGroup label="Overview" items={navOverview} />
          <SidebarGroup label="Management" items={navManagement} />
          <SidebarGroup label="System" items={navSystem} />
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-br from-violet-400 to-indigo-500 text-xs font-semibold text-white">
                SJ
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Sarah Jenkins</p>
              <p className="truncate text-xs text-muted-foreground">Institution Admin</p>
            </div>
            <button
              onClick={() => navigate({ to: "/" })}
              aria-label="Sign out"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search candidates, exams, or invigilators…"
              className="h-10 rounded-xl border-input bg-muted/40 pl-10 text-sm"
            />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
            </button>
            <button className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Moon className="h-5 w-5" />
            </button>
            <Button
              className="ml-2 h-10 rounded-xl text-white shadow-md"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> New Exam
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto w-full max-w-[1400px] space-y-6"
          >
            {/* Heading row */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Institution Overview</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monitor examination activities, candidate performance, and system health.
                </p>
              </div>
              <RangeTabs />
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((m, i) => (
                <MetricCard key={m.label} {...m} delay={i * 0.05} />
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Pass/Fail Trends</h3>
                    <p className="text-xs text-muted-foreground">
                      Historical performance across all departments
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <LegendDot color="bg-emerald-500" label="Pass" />
                    <LegendDot color="bg-rose-500" label="Fail" />
                  </div>
                </div>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={passFailData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 260)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 260)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 260)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid oklch(0.92 0.01 260)",
                          fontSize: 12,
                        }}
                      />
                      <Line type="monotone" dataKey="pass" stroke="oklch(0.7 0.17 162)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="fail" stroke="oklch(0.65 0.22 22)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Live Bandwidth</h3>
                    <p className="text-xs text-muted-foreground">Video stream consumption</p>
                  </div>
                  <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                  </Badge>
                </div>
                <div className="mt-4 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bandwidthData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.58 0.22 262)" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="oklch(0.58 0.22 262)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="mbps" stroke="oklch(0.58 0.22 262)" strokeWidth={2} fill="url(#bw)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Stat label="Peak Today" value="1.2 Gbps" />
                  <Stat label="Avg Latency" value="42 ms" />
                </div>
              </Card>
            </div>

            {/* Bottom tables */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Upcoming Exams</h3>
                    <p className="text-xs text-muted-foreground">Next 48 hours schedule</p>
                  </div>
                  <Link to="/dashboard" className="text-xs font-semibold text-[color:var(--brand-blue)] hover:underline">
                    View All
                  </Link>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="pb-3 font-medium">Exam Title</th>
                        <th className="pb-3 font-medium">Time</th>
                        <th className="pb-3 font-medium">Candidates</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {upcomingExams.map((e) => (
                        <tr key={e.code} className="align-top">
                          <td className="py-3 pr-3">
                            <p className="font-semibold">{e.title} {e.code}</p>
                            <p className="text-xs text-muted-foreground">{e.dept}</p>
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-medium">{e.time}</p>
                            <p className="text-xs text-muted-foreground">{e.when}</p>
                          </td>
                          <td className="py-3 pr-3">
                            <span className="inline-flex items-center gap-1 text-sm">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" /> {e.candidates}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", e.statusTone)}>
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Invigilator Status</h3>
                    <p className="text-xs text-muted-foreground">Live monitoring assignments</p>
                  </div>
                  <button className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted">
                    <Filter className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="pb-3 font-medium">Invigilator</th>
                        <th className="pb-3 font-medium">Assigned Exam</th>
                        <th className="pb-3 font-medium">Ratio</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invigilators.map((i) => (
                        <tr key={i.name} className="align-top">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-white", i.avatar)}>
                                {i.initials}
                              </div>
                              <div>
                                <p className="font-semibold">{i.name}</p>
                                <p className="text-xs text-muted-foreground">{i.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-medium">{i.exam}</p>
                            <p className="text-xs text-muted-foreground">{i.room}</p>
                          </td>
                          <td className="py-3 pr-3 text-sm">{i.ratio}</td>
                          <td className="py-3">
                            <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", i.statusTone)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", i.dot)} />
                              {i.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function SidebarGroup({
  label,
  items,
}: {
  label: string;
  items: { label: string; icon: React.ComponentType<{ className?: string }>; active?: boolean }[];
}) {
  return (
    <div>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.label}>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  it.active
                    ? "bg-[color:var(--brand-blue)]/10 text-[color:var(--brand-blue)]"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RangeTabs() {
  const tabs = ["Today", "7D", "30D"];
  return (
    <div className="inline-flex rounded-xl border border-border bg-background p-1 shadow-sm">
      {tabs.map((t, i) => (
        <button
          key={t}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
            i === 0
              ? "bg-[color:var(--brand-blue)] text-white shadow"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-background p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  trend,
  sub,
  progress,
  icon: Icon,
  tone,
  delay = 0,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  sub?: string;
  progress?: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tone)}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              trend === "up"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700",
            )}
          >
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta}
          </span>
        )}
        {sub && !progress && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
        </div>
      )}
    </motion.div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
    </div>
  );
}