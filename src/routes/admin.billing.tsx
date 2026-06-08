import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Database,
  Download,
  TrendingUp,
  UsersRound,
  Video,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBillingSummary, listAuditLogs } from "@/lib/scheduling";

export const Route = createFileRoute("/admin/billing")({
  component: BillingPage,
  head: () => ({
    meta: [
      { title: "Billing & Plans · Orcalis Assess" },
      {
        name: "description",
        content:
          "Manage your Orcalis Assess subscription, usage, security audit logs, and support tickets.",
      },
    ],
  }),
});

const tabs = ["Billing", "Security Logs", "Tickets"] as const;

function BillingPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Billing");
  const billingQ = useQuery({ queryKey: ["billing-summary"], queryFn: getBillingSummary });
  const auditQ = useQuery({ queryKey: ["audit-logs"], queryFn: () => listAuditLogs(25) });

  const summary = billingQ.data;
  const usageData = summary?.usageByDay ?? [];
  const candidatesSpark = summary?.candidatesSpark ?? [];
  const auditLogs = auditQ.data ?? [];

  const proctorPct = summary
    ? Math.min(100, Math.round((summary.totalProctoringEvents / 5000) * 100))
    : 0;
  const storagePct = summary
    ? Math.min(100, Math.round((summary.totalRegistrations / 2000) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-[oklch(0.13_0.025_265)] text-white">
      <AdminShellDark
        tab={tab}
        onTab={setTab}
      >
        <div className="flex flex-wrap items-end justify-between gap-3 pb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Current Plan
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Enterprise Tier</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10">
              <Download className="h-4 w-4" /> Download Invoices
            </Button>
            <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90">
              Manage Subscription
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MeterCard
            icon={Video}
            label="Proctoring Events"
            value={summary ? summary.totalProctoringEvents.toLocaleString() : "—"}
            limit="/ 5,000"
            pct={proctorPct}
            sub={`${proctorPct}% utilized`}
            footer={`${summary?.highSeverityEvents ?? 0} high severity`}
            color="from-indigo-400 to-violet-500"
          />
          <MeterCard
            icon={Database}
            label="Registrations (30d)"
            value={summary ? summary.totalRegistrations.toLocaleString() : "—"}
            limit="/ 2,000"
            pct={storagePct}
            sub={storagePct >= 80 ? "Approaching limit" : `${storagePct}% utilized`}
            footer={`${summary?.totalCompleted ?? 0} completed`}
            color="from-violet-400 to-fuchsia-500"
            warn={storagePct >= 80}
          />
          <SparkCard data={candidatesSpark} active={summary?.activeCandidates ?? 0} />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-semibold">Usage Analytics</h3>
            <div className="flex gap-1 rounded-full bg-white/5 p-1 text-xs">
              {["30 Days", "3 Months", "Year"].map((p, i) => (
                <button
                  key={p}
                  className={cn(
                    "rounded-full px-3 py-1 font-medium",
                    i === 0 ? "bg-indigo-500 text-white" : "text-white/60",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="examFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} stroke="rgba(255,255,255,0.5)" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.04 265)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "white" }} />
                <Area type="monotone" dataKey="exams" name="Exams Conducted" stroke="#6366f1" strokeWidth={2.5} fill="url(#examFill)" />
                <Line type="monotone" dataKey="flags" name="Proctoring Flags" stroke="#a78bfa" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Security & Access
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
            <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-xs">
              {["All Events", "Authentication", "Exam Settings"].map((p, i) => (
                <button
                  key={p}
                  className={cn(
                    "rounded-full px-3 py-1 font-medium",
                    i === 0 ? "bg-white text-slate-900" : "text-white/60",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.12em] text-white/50">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Registration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-white/50">
                      {auditQ.isLoading ? "Loading audit events…" : "No proctoring events recorded yet."}
                    </td>
                  </tr>
                )}
                {auditLogs.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-mono text-xs text-white/60">{row.ts}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                        {row.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{row.event}</td>
                    <td className="px-4 py-3 text-white/70">{row.resource}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          row.status === "Success"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : row.status === "Warning"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-rose-500/15 text-rose-300",
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-white/60">
                      {row.registration_id.slice(0, 8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminShellDark>
    </div>
  );
}

function MeterCard({
  icon: Icon,
  label,
  value,
  limit,
  pct,
  sub,
  footer,
  color,
  warn,
}: {
  icon: typeof Video;
  label: string;
  value: string;
  limit: string;
  pct: number;
  sub: string;
  footer: string;
  color: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">{label}</p>
        <Icon className="h-4 w-4 text-indigo-300" />
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-xs text-white/50">{limit}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full bg-gradient-to-r", color)} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className={warn ? "text-amber-300" : "text-white/60"}>{sub}</span>
        <span className="text-white/50">{footer}</span>
      </div>
    </div>
  );
}

function SparkCard({ data, active }: { data: { i: number; v: number }[]; active: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
          Active Candidates (30d)
        </p>
        <UsersRound className="h-4 w-4 text-indigo-300" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold">{active.toLocaleString()}</span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
          <TrendingUp className="h-3 w-3" /> live
        </span>
      </div>
      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="v" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AdminShellDark({
  tab,
  onTab,
  children,
}: {
  tab: (typeof tabs)[number];
  onTab: (t: (typeof tabs)[number]) => void;
  children: React.ReactNode;
}) {
  return (
    <AdminShell
      title="Administration"
      breadcrumbs={[{ label: "Administration" }, { label: tab }]}
      actions={
        <div className="mx-auto flex items-center gap-1 rounded-full border border-border bg-background p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => onTab(t)}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition",
                t === tab ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              style={t === tab ? { background: "var(--gradient-primary)" } : undefined}
            >
              {t}
            </button>
          ))}
        </div>
      }
    >
      <div className="-mx-4 -my-6 min-h-[calc(100vh-8rem)] bg-[oklch(0.13_0.025_265)] px-4 py-6 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {children}
      </div>
    </AdminShell>
  );
}