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
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
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
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { getAnalyticsSummary } from "@/lib/scheduling";

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

const questionData = [
  { q: "Q1", correct: 88, band: "easy" },
  { q: "Q2", correct: 72, band: "easy" },
  { q: "Q3", correct: 91, band: "easy" },
  { q: "Q4", correct: 44, band: "medium" },
  { q: "Q5", correct: 58, band: "medium" },
  { q: "Q6", correct: 31, band: "hard" },
  { q: "Q7", correct: 84, band: "easy" },
  { q: "Q8", correct: 70, band: "easy" },
  { q: "Q9", correct: 52, band: "medium" },
  { q: "Q10", correct: 89, band: "easy" },
];

const bandColor: Record<string, string> = {
  easy: "oklch(0.45 0.08 165)",
  medium: "oklch(0.78 0.15 85)",
  hard: "oklch(0.62 0.2 25)",
};

const subjectRadar = [
  { subject: "English", score: 82 },
  { subject: "Bangla", score: 74 },
  { subject: "Physics", score: 68 },
  { subject: "Math", score: 88 },
  { subject: "Biology", score: 71 },
  { subject: "Sports", score: 60 },
];

const growthData = [
  { attempt: "Attempt 1", score: 42 },
  { attempt: "Attempt 2", score: 64 },
  { attempt: "Attempt 3", score: 81 },
];

const interestData = [
  { name: "Chemistry", value: 45, color: "oklch(0.45 0.08 165)" },
  { name: "Physics", value: 25, color: "oklch(0.78 0.15 85)" },
  { name: "Biology", value: 20, color: "oklch(0.88 0.02 260)" },
  { name: "Mathematics", value: 10, color: "oklch(0.75 0.04 260)" },
];

function AnalyticsPage() {
  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
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
      unit: `≥ ${summary?.passingThreshold ?? 60}%`,
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
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" /> This Semester
          </Button>
          <Button size="sm" className="gap-2" style={{ background: "var(--gradient-primary)" }}>
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
              No completed attempts yet. Once candidates finish exams, per-exam
              averages will appear here.
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
                      style={{
                        width: `${Math.min(100, e.average)}%`,
                        background: "oklch(0.45 0.08 165)",
                      }}
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
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold">Performance Trend (sample)</h3>
              <p className="text-xs text-muted-foreground">
                Multi-attempt trend will populate once retake data is recorded.
              </p>
            </div>
          </div>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.93 0.005 260)" />
                <XAxis dataKey="attempt" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="oklch(0.45 0.08 165)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="text-base font-semibold">Most Interested Subjects</h3>
          <div className="relative mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={interestData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {interestData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[11px] text-muted-foreground">Total Enroll</p>
              <p className="text-xl font-bold">
                {summary?.totalRegistrations ?? 0}
              </p>
            </div>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
            {interestData.map((d) => (
              <li key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-semibold">{d.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}

// Keep Legend imported so tree-shaker doesn't drop, even if unused inline.
void Legend;
void ArrowUpRight;
void ArrowDownRight;
void bandColor;
void subjectRadar;