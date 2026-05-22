import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { getSession, isAdminUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  AlertTriangle,
  Bell,
  Building2,
  CreditCard,
  Filter,
  Heart,
  LayoutDashboard,
  Maximize2,
  Mic,
  Scan,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  Eye,
  Activity,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: SuperAdminPage,
  head: () => ({
    meta: [
      { title: "Super Admin · Orcalis Assess" },
      {
        name: "description",
        content:
          "Cross-institution platform oversight — concurrent candidates, AI interventions, system health, and live proctoring alerts on Orcalis Assess.",
      },
    ],
  }),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      return redirect({ to: "/" });
    }

    if (!(await isAdminUser(session.user))) {
      return redirect({ to: "/dashboard" });
    }
  },
});

type NavItem = { label: string; icon: typeof LayoutDashboard; badge?: string; active?: boolean };

const navPlatform: NavItem[] = [
  { label: "Institutions", icon: Building2 },
  { label: "Active Exams", icon: Scan, badge: "124" },
  { label: "Candidates", icon: UsersRound },
];

const navMonitoring: NavItem[] = [
  { label: "AI Violations", icon: ShieldAlert, badge: "12" },
  { label: "System Health", icon: Heart },
];

const navAdmin: NavItem[] = [
  { label: "Billing & Revenue", icon: CreditCard },
  { label: "Settings", icon: Settings },
];

const bandwidthData = Array.from({ length: 23 }, (_, i) => {
  const x = i;
  const wave =
    18 +
    Math.exp(-Math.pow((x - 10) / 3.2, 2)) * 28 +
    Math.sin(x / 2) * 1.5;
  return { t: `${String(i).padStart(2, "0")}:00`, v: Math.max(6, Math.round(wave)) };
});

const violationData = [
  { name: "Multiple Faces", value: 42, color: "oklch(0.65 0.22 22)" },
  { name: "Looking Away", value: 35, color: "oklch(0.78 0.17 70)" },
  { name: "Audio Detected", value: 23, color: "oklch(0.55 0.22 275)" },
];

const interventions = [
  {
    candidate: "Michael Chen",
    id: "CND-8492",
    institution: "Stanford Univ.",
    exam: "CS101 Final",
    violation: "Multiple Faces",
    vIcon: UsersRound,
    vTone: "bg-rose-50 text-rose-700 ring-rose-200",
    confidence: 98,
    bar: "bg-rose-500",
    time: "Just now",
    avatar: "from-sky-400 to-indigo-500",
    initials: "MC",
  },
  {
    candidate: "Sarah Jenkins",
    id: "CND-7731",
    institution: "Tech Institute",
    exam: "Data Structures",
    violation: "Prolonged Look Away",
    vIcon: Eye,
    vTone: "bg-amber-50 text-amber-700 ring-amber-200",
    confidence: 85,
    bar: "bg-amber-500",
    time: "2 min ago",
    avatar: "from-rose-400 to-orange-400",
    initials: "SJ",
  },
  {
    candidate: "David Jones",
    id: "CND-9012",
    institution: "Global Cert Corp",
    exam: "AWS Architect",
    violation: "Speech Detected",
    vIcon: Mic,
    vTone: "bg-violet-50 text-violet-700 ring-violet-200",
    confidence: 92,
    bar: "bg-violet-500",
    time: "5 min ago",
    avatar: "from-slate-400 to-slate-600",
    initials: "DJ",
  },
];

function SuperAdminPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[oklch(0.985_0.005_260)]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Orcalis Assess</span>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-2">
          <ul className="space-y-1">
            <li>
              <button
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm"
                style={{ background: "var(--gradient-primary)" }}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
            </li>
          </ul>
          <NavSection label="Platform" items={navPlatform} />
          <NavSection label="Monitoring" items={navMonitoring} />
          <NavSection label="Administration" items={navAdmin} />
        </nav>

        <div className="m-3 rounded-xl bg-[oklch(0.18_0.04_265)] p-3 text-white">
          <p className="text-xs font-semibold">System Status</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            All systems operational
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
          <h2 className="text-[15px] font-semibold tracking-tight">Super Admin Overview</h2>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search institutions, exams..."
                className="h-9 w-72 rounded-lg border-input bg-muted/40 pl-9 text-sm"
              />
            </div>
            <button className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
            </button>
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-background py-1 pl-1 pr-3 transition hover:bg-muted"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-sky-400 to-indigo-500 text-[11px] font-semibold text-white">
                AC
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight">Alex Carter</p>
                <p className="text-[11px] text-muted-foreground">Super Admin</p>
              </div>
              <Maximize2 className="ml-1 hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto w-full max-w-[1400px] space-y-6"
          >
            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Concurrent Candidates"
                value="42,891"
                delta="+12.5%"
                sub="vs last hour"
                trend="up"
                accent="oklch(0.58 0.22 262)"
                icon={Scan}
                iconTone="bg-sky-50 text-sky-600"
              />
              <KpiCard
                label="Active Exams"
                value="1,204"
                delta="+3.2%"
                sub="vs yesterday"
                trend="up"
                accent="oklch(0.58 0.22 262)"
                icon={Activity}
                iconTone="bg-violet-50 text-violet-600"
              />
              <KpiCard
                label="AI Interventions"
                value="342"
                delta="-0.8%"
                sub="vs avg baseline"
                trend="down"
                accent="oklch(0.78 0.17 70)"
                icon={AlertTriangle}
                iconTone="bg-rose-50 text-rose-600"
              />
              <KpiCard
                label="System Health"
                value="99.98%"
                health
                accent="oklch(0.7 0.17 162)"
                icon={Heart}
                iconTone="bg-emerald-50 text-emerald-600"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Platform Usage & Capacity</h3>
                    <p className="text-xs text-muted-foreground">
                      Concurrent users vs allocated server nodes
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
                    {["24h", "7d", "30d"].map((r, idx) => (
                      <button
                        key={r}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium transition",
                          idx === 0
                            ? "bg-[color:var(--brand-blue)] text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bandwidthData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="usage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.58 0.22 262)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="oklch(0.58 0.22 262)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid oklch(0.92 0.01 260)",
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`${v}k`, "Users"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="oklch(0.58 0.22 262)"
                        strokeWidth={2.5}
                        fill="url(#usage)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <div>
                  <h3 className="text-base font-semibold">Violation Types</h3>
                  <p className="text-xs text-muted-foreground">Distribution of AI flagged events</p>
                </div>
                <div className="mt-2 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={violationData}
                        innerRadius={56}
                        outerRadius={84}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {violationData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-2">
                  {violationData.map((d) => (
                    <li key={d.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: d.color }}
                        />
                        <span className="text-foreground/80">{d.name}</span>
                      </span>
                      <span className="font-semibold tabular-nums">{d.value}%</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Live AI Interventions */}
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">Live AI Interventions</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600 ring-1 ring-rose-200">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                      </span>
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Real-time feed of high-confidence proctoring alerts
                  </p>
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-muted">
                  <Filter className="h-3.5 w-3.5" /> High Severity
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 font-medium">Candidate</th>
                      <th className="pb-3 font-medium">Institution / Exam</th>
                      <th className="pb-3 font-medium">Violation Type</th>
                      <th className="pb-3 font-medium">Confidence</th>
                      <th className="pb-3 font-medium">Time</th>
                      <th className="pb-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {interventions.map((row) => (
                      <tr key={row.id} className="align-middle">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-white",
                                row.avatar,
                              )}
                            >
                              {row.initials}
                            </div>
                            <div>
                              <p className="font-semibold leading-tight">{row.candidate}</p>
                              <p className="text-xs text-muted-foreground">ID: {row.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-medium leading-tight">{row.institution}</p>
                          <p className="text-xs text-muted-foreground">{row.exam}</p>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
                              row.vTone,
                            )}
                          >
                            <row.vIcon className="h-3 w-3" />
                            {row.violation}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full", row.bar)}
                                style={{ width: `${row.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold tabular-nums">
                              {row.confidence}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-muted-foreground">{row.time}</td>
                        <td className="py-3 text-right">
                          <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted">
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 border-t border-border pt-3 text-center">
                <button className="text-xs font-semibold text-[color:var(--brand-blue)] hover:underline">
                  View All Events (142)
                </button>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div>
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.label}>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/75 transition hover:bg-muted hover:text-foreground">
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 ring-1 ring-rose-200">
                  {item.badge}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-background p-5 shadow-[0_1px_2px_oklch(0.2_0.02_260/0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

type KpiProps = {
  label: string;
  value: string;
  delta?: string;
  sub?: string;
  trend?: "up" | "down";
  accent: string;
  icon: typeof LayoutDashboard;
  iconTone: string;
  health?: boolean;
};

function KpiCard({ label, value, delta, sub, trend, accent, icon: Icon, iconTone, health }: KpiProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconTone)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {health ? (
        <>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Latency: <span className="font-semibold text-foreground">42ms</span></span>
            <span className="h-3 w-px bg-border" />
            <span>Load: <span className="font-semibold text-foreground">34%</span></span>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full rounded-full" style={{ background: accent }} />
          </div>
        </>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold",
                trend === "up"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700",
              )}
            >
              {trend === "up" ? "▲" : "▼"} {delta}
            </span>
            <span className="text-muted-foreground">{sub}</span>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: trend === "up" ? "72%" : "48%",
                background: `linear-gradient(90deg, ${accent}, oklch(0.78 0.17 70))`,
              }}
            />
          </div>
        </>
      )}
    </Card>
  );
}