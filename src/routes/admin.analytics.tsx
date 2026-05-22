import { createFileRoute } from "@tanstack/react-router";
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

const kpis = [
  { label: "Average Score", value: "78.5%", unit: "Marks", delta: "+3.7%", trend: "up", icon: Trophy, tint: "text-amber-600 bg-amber-50" },
  { label: "Highest Score Achieved", value: "98%", unit: "Marks", delta: "+1.5%", trend: "up", icon: Trophy, tint: "text-emerald-600 bg-emerald-50" },
  { label: "Total Exams Completed", value: "1,248", unit: "", delta: "+12.4%", trend: "up", icon: BookOpen, tint: "text-sky-600 bg-sky-50" },
  { label: "Passing Rate", value: "82.3%", unit: "", delta: "-0.8%", trend: "down", icon: CheckCircle2, tint: "text-rose-600 bg-rose-50" },
] as const;

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
  return (
    <AdminShell
      title="Results & Analytics"
      breadcrumbs={[{ label: "Results & Analytics" }, { label: "Overview" }]}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Results & Analytics</h1>
          <p className="text-sm text-muted-foreground">8th August, 2025</p>
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
          const TrendIcon = k.trend === "up" ? ArrowUpRight : ArrowDownRight;
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
              <div className={`mt-2 flex items-center gap-1 text-xs ${k.trend === "up" ? "text-emerald-600" : "text-rose-600"}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span className="font-medium">{k.delta}</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-semibold">Question-Level Analysis</h3>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { pct: "55%", label: "Easy to answer", sub: "75% answered Correct", color: "text-emerald-600" },
              { pct: "30%", label: "Medium difficulty", sub: "51% answered Correct", color: "text-amber-600" },
              { pct: "15%", label: "Hard to answer", sub: "25% answered Correct", color: "text-rose-600" },
            ].map((s) => (
              <div key={s.label}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.pct}</p>
                <p className="text-xs font-medium">{s.label}</p>
                <p className="text-[11px] text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.93 0.005 260)" />
                <XAxis dataKey="q" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} domain={[0, 100]} />
                <Tooltip cursor={{ fill: "oklch(0.96 0.005 260)" }} />
                <Bar dataKey="correct" radius={[6, 6, 0, 0]}>
                  {questionData.map((d) => (
                    <Cell key={d.q} fill={bandColor[d.band]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-semibold">Subject Wise Average Score</h3>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={subjectRadar}>
                <PolarGrid stroke="oklch(0.88 0.005 260)" />
                <PolarAngleAxis dataKey="subject" fontSize={11} />
                <Radar
                  dataKey="score"
                  stroke="oklch(0.45 0.08 165)"
                  fill="oklch(0.45 0.08 165)"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold">Performance Growth Over Multiple Attempts</h3>
              <p className="text-xs text-muted-foreground">Cohort analysis across standard retake intervals</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">+27.7%</span>
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
              <p className="text-xl font-bold">249</p>
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