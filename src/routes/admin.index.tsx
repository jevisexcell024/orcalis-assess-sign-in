import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Filter,
  Heart,
  LayoutDashboard,
  Scan,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminShell } from "@/components/admin/AdminShell";
import { getDashboardOverview } from "@/lib/scheduling";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
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
});

function SuperAdminPage() {
  const [chartRange, setChartRange] = useState<"24h" | "7d" | "30d">("24h");
  const [sevFilter, setSevFilter] = useState<"all" | "high">("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard-overview"],
    queryFn: getDashboardOverview,
    refetchInterval: 30_000,
  });

  const bandwidthData = data?.usageByHour ?? [];
  const violationData = data?.violationTypes ?? [];
  const interventions = data?.recentInterventions ?? [];
  const fmt = (n: number) => n.toLocaleString();

  return (
    <AdminShell title="Super Admin Overview">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-[1400px] space-y-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Active Candidates"
            value={isLoading ? "—" : fmt(data?.activeCandidates ?? 0)}
            sub="in-progress attempts"
            trend="up"
            accent="oklch(0.58 0.22 262)"
            icon={Scan}
            iconTone="bg-sky-50 text-sky-600"
          />
          <KpiCard
            label="Published Exams"
            value={isLoading ? "—" : fmt(data?.activeExams ?? 0)}
            sub="live across orgs"
            trend="up"
            accent="oklch(0.58 0.22 262)"
            icon={Activity}
            iconTone="bg-violet-50 text-violet-600"
          />
          <KpiCard
            label="AI Interventions"
            value={isLoading ? "—" : fmt(data?.totalInterventions ?? 0)}
            sub="last 24 hours"
            trend="down"
            accent="oklch(0.78 0.17 70)"
            icon={AlertTriangle}
            iconTone="bg-rose-50 text-rose-600"
          />
          <KpiCard
            label="System Health"
            value={
              isLoading ? "—" : `${(data?.systemHealthPct ?? 100).toFixed(2)}%`
            }
            health
            accent="oklch(0.7 0.17 162)"
            icon={Heart}
            iconTone="bg-emerald-50 text-emerald-600"
          />
        </div>

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
                {(["24h", "7d", "30d"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition",
                      chartRange === r
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
                    formatter={(v: number) => [`${v}`, "Attempts"]}
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
            {violationData.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                No proctoring events recorded in the last 24 hours.
              </p>
            ) : (
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
            )}
          </Card>
        </div>

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
            <button
              onClick={() => setSevFilter((f) => f === "all" ? "high" : "all")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-muted",
                sevFilter === "high"
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-border bg-background text-foreground/80"
              )}
            >
              <Filter className="h-3.5 w-3.5" /> {sevFilter === "high" ? "All Severity" : "High Severity"}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 font-medium">Candidate</th>
                  <th className="pb-3 font-medium">Exam</th>
                  <th className="pb-3 font-medium">Violation Type</th>
                  <th className="pb-3 font-medium">Confidence</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {interventions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No live interventions. All sessions are clean.
                    </td>
                  </tr>
                ) : (
                  interventions.filter((row) => sevFilter === "all" || row.severity === "high").map((row) => {
                    const tone =
                      row.severity === "high"
                        ? "bg-rose-50 text-rose-700 ring-rose-200"
                        : "bg-amber-50 text-amber-700 ring-amber-200";
                    const bar = row.severity === "high" ? "bg-rose-500" : "bg-amber-500";
                    const initials = row.candidate
                      .split(" ")
                      .map((p) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "??";
                    return (
                      <tr key={row.id} className="align-middle">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[11px] font-semibold text-white">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold leading-tight">{row.candidate}</p>
                              <p className="text-xs text-muted-foreground">ID: {row.candidateId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-medium leading-tight">{row.exam}</p>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
                              tone,
                            )}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {row.violation}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full", bar)}
                                style={{ width: `${row.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold tabular-nums">
                              {row.confidence}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-muted-foreground">{row.at}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => toast.info(`Reviewing violation for ${row.candidate} — opening proctoring session.`)}
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 border-t border-border pt-3 text-center">
            <button
              onClick={() => toast.info("Navigating to full AI Violations log.")}
              className="text-xs font-semibold text-[color:var(--brand-blue)] hover:underline"
            >
              View All Events ({data?.totalEventCount ?? 0})
            </button>
          </div>
        </Card>
      </motion.div>
    </AdminShell>
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