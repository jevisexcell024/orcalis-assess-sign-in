import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { getAnalyticsSummary } from "@/lib/scheduling";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";

const NAVY = "oklch(0.385 0.12 247)";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Results & Analytics · Orcalis Assess" },
      {
        name: "description",
        content:
          "Cohort-wide performance analytics, question-level difficulty analysis, and subject mastery on Orcalis Assess.",
      },
    ],
  }),
});

const PIE_COLORS = [
  "oklch(0.45 0.08 165)",
  "oklch(0.62 0.08 250)",
  "oklch(0.78 0.15 85)",
  "oklch(0.62 0.2 25)",
  "oklch(0.75 0.04 260)",
];

async function getMonthlyTrend() {
  const { data, error } = await supabase
    .from("exam_registrations")
    .select("created_at, status")
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const buckets: Record<string, { month: string; completed: number; registered: number }> = {};
  for (const r of rows) {
    const key = r.created_at.slice(0, 7);
    if (!buckets[key]) {
      const [y, m] = key.split("-");
      buckets[key] = {
        month: new Date(+y, +m - 1).toLocaleString("default", { month: "short", year: "2-digit" }),
        completed: 0,
        registered: 0,
      };
    }
    buckets[key].registered++;
    if (r.status === "completed") buckets[key].completed++;
  }
  return Object.values(buckets).slice(-8);
}

function AnalyticsPage() {
  const [semester, setSemester] = useState("this");

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
  });

  const { data: trendData = [] } = useQuery({
    queryKey: ["analytics-monthly-trend"],
    queryFn: getMonthlyTrend,
    staleTime: 60_000,
  });

  const fmtPct = (v: number | null | undefined, digits = 1) =>
    typeof v === "number" ? `${v.toFixed(digits)}%` : "—";

  const kpis = [
    {
      label: "Average Score",
      value: fmtPct(summary?.averageScore),
      unit: "Marks",
      icon: Trophy,
      tint: "text-amber-600 bg-amber-50",
    },
    {
      label: "Highest Score Achieved",
      value: fmtPct(summary?.highestScore, 0),
      unit: "Marks",
      icon: Trophy,
      tint: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Total Exams Completed",
      value: summary ? summary.totalCompleted.toLocaleString() : "—",
      unit: "",
      icon: BookOpen,
      tint: "text-sky-600 bg-sky-50",
    },
    {
      label: "Passing Rate",
      value: fmtPct(summary?.passingRate),
      unit: `>= ${summary?.passingThreshold ?? 60}%`,
      icon: CheckCircle2,
      tint: "text-rose-600 bg-rose-50",
    },
  ];

  const distribution = summary?.scoreDistribution ?? [];
  const perExam = summary?.perExam ?? [];

  return (
    <AdminShell
      title="Results & Analytics"
      breadcrumbs={[{ label: "Results & Analytics" }, { label: "Overview" }]}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Results & Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {summary
              ? `${summary.totalRegistrations.toLocaleString()} total registrations · ${summary.totalCompleted.toLocaleString()} completed`
              : "Loading live results…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const next = semester === "this" ? "last" : "this";
              setSemester(next);
              toast.info(`Showing ${next === "this" ? "current" : "previous"} semester data.`);
            }}
          >
            <Calendar className="h-4 w-4" /> {semester === "this" ? "This Semester" : "Last Semester"}
          </Button>
          <Button
            size="sm"
            className="gap-2 text-white"
            style={{ background: NAVY }}
            onClick={() => {
              exportToCSV(
                `analytics-report-${semester}-semester-${new Date().toISOString().slice(0, 10)}.csv`,
                perExam as any[],
                [
                  { key: "exam",      header: "Exam" },
                  { key: "completed", header: "Completed" },
                  { key: "average",   header: "Avg Score" },
                ]
              );
              toast.success("Analytics report exported as CSV.");
            }}
          >
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${k.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight">{k.value}</span>
                {k.unit && <span className="text-xs text-muted-foreground">{k.unit}</span>}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Live from completed registrations</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-semibold">Score Distribution</h3>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Candidate count per score band across all completed attempts.
          </p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.93 0.005 260)" />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                <Tooltip cursor={{ fill: "oklch(0.96 0.005 260)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="oklch(0.45 0.08 165)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-semibold">Average Score by Exam</h3>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          {perExam.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No completed attempts yet. Per-exam averages will appear here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {perExam.map((e) => (
                <li key={e.exam}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate pr-2">{e.exam}</span>
                    <span className="text-muted-foreground">
                      {e.average.toFixed(1)}% · {e.completed}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, e.average)}%`, background: "oklch(0.45 0.08 165)" }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <h3 className="text-base font-semibold">Monthly Registrations & Completions</h3>
          <p className="text-xs text-muted-foreground mt-1">Last 8 months of activity.</p>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.93 0.005 260)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="registered" stroke="oklch(0.62 0.08 250)" strokeWidth={2} dot={{ r: 3 }} name="Registered" />
                <Line type="monotone" dataKey="completed" stroke="oklch(0.45 0.08 165)" strokeWidth={2.5} dot={{ r: 4 }} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="text-base font-semibold">Top Exams by Completions</h3>
          {perExam.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No completed exams yet.</p>
          ) : (
            <>
              <div className="relative mt-4 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={perExam.slice(0, 5).map((e) => ({ name: e.exam, value: e.completed }))}
                      dataKey="value"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {perExam.slice(0, 5).map((_e, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[11px] text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{summary?.totalCompleted ?? 0}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs">
                {perExam.slice(0, 5).map((e, i) => (
                  <li key={e.exam} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="truncate text-muted-foreground">{e.exam}</span>
                    <span className="ml-auto font-semibold tabular-nums">{e.completed}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

// Keep unused recharts imports alive for tree-shaker
void Legend;
void ArrowUpRight;
void ArrowDownRight;
