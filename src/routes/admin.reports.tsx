import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileText, Download, Filter, BarChart2, Users2,
  GraduationCap, Award, CalendarDays, Loader2, CheckCircle2,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/lib/csv";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports · Orcalis Assess" }] }),
});

const NAVY = "oklch(0.385 0.12 247)";

const REPORT_TYPES = [
  {
    id: "exam_results",
    label: "Exam Results Report",
    desc: "Detailed breakdown of all exam scores, grades and pass rates per exam.",
    icon: BarChart2,
    formats: ["CSV"],
  },
  {
    id: "candidate_report",
    label: "Candidate Report",
    desc: "List of all registered candidates with status, scores and eligibility.",
    icon: Users2,
    formats: ["CSV"],
  },
  {
    id: "attendance_report",
    label: "Attendance Report",
    desc: "Session-level attendance rates, absentees and late check-ins.",
    icon: CalendarDays,
    formats: ["CSV"],
  },
  {
    id: "academic_integrity",
    label: "Integrity Report",
    desc: "Summary of all AI and proctoring flags raised during exam sessions.",
    icon: Award,
    formats: ["CSV"],
  },
  {
    id: "student_transcript",
    label: "Student Transcripts",
    desc: "Official academic transcripts — scores per exam per candidate.",
    icon: GraduationCap,
    formats: ["CSV"],
  },
  {
    id: "analytics_summary",
    label: "Analytics Summary",
    desc: "Platform-wide KPIs: active exams, candidate throughput, score distributions.",
    icon: BarChart2,
    formats: ["CSV"],
  },
];

async function generateReport(reportId: string, dateFrom: string, dateTo: string): Promise<void> {
  const dateFilter = (q: any) => {
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo)   q = q.lte("created_at", dateTo + "T23:59:59");
    return q;
  };

  if (reportId === "exam_results") {
    let q = supabase
      .from("exam_registrations")
      .select("id, status, score, created_at, exams:exam_id(title), profiles:candidate_id(email, full_name)");
    const { data, error } = await dateFilter(q);
    if (error) throw error;
    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      exam_title: r.exams?.title ?? "",
      email: r.profiles?.email ?? "",
      full_name: r.profiles?.full_name ?? "",
      status: r.status,
      score: r.score ?? "",
      created_at: r.created_at,
    }));
    exportToCSV(`exam-results-${Date.now()}.csv`, rows, [
      { key: "id",         header: "Registration ID" },
      { key: "exam_title", header: "Exam" },
      { key: "email",      header: "Candidate Email" },
      { key: "full_name",  header: "Candidate Name" },
      { key: "status",     header: "Status" },
      { key: "score",      header: "Score (%)" },
      { key: "created_at", header: "Registered At" },
    ]);
    return;
  }

  if (reportId === "candidate_report") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at");
    if (error) throw error;
    exportToCSV(`candidates-${Date.now()}.csv`, (data ?? []) as any[], [
      { key: "id",         header: "Candidate ID" },
      { key: "email",      header: "Email" },
      { key: "full_name",  header: "Full Name" },
      { key: "role",       header: "Role" },
      { key: "created_at", header: "Joined At" },
    ]);
    return;
  }

  if (reportId === "attendance_report") {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select("id, status, started_at, submitted_at, exam_registrations:registration_id(exams:exam_id(title), profiles:candidate_id(email, full_name))");
    if (error) throw error;
    const rows = (data ?? []).map((a: any) => ({
      attempt_id: a.id,
      exam: a.exam_registrations?.exams?.title ?? "",
      candidate: a.exam_registrations?.profiles?.full_name ?? a.exam_registrations?.profiles?.email ?? "",
      status: a.status,
      started_at: a.started_at ?? "",
      submitted_at: a.submitted_at ?? "",
    }));
    exportToCSV(`attendance-${Date.now()}.csv`, rows, [
      { key: "attempt_id",   header: "Attempt ID" },
      { key: "exam",         header: "Exam" },
      { key: "candidate",    header: "Candidate" },
      { key: "status",       header: "Status" },
      { key: "started_at",   header: "Started At" },
      { key: "submitted_at", header: "Submitted At" },
    ]);
    return;
  }

  if (reportId === "academic_integrity") {
    let q = supabase
      .from("proctoring_events")
      .select("id, event_type, severity, message, created_at, exam_registrations:registration_id(exams:exam_id(title), profiles:candidate_id(email, full_name))");
    const { data, error } = await dateFilter(q);
    if (error) throw error;
    const rows = (data ?? []).map((ev: any) => ({
      id: ev.id,
      exam: ev.exam_registrations?.exams?.title ?? "",
      candidate: ev.exam_registrations?.profiles?.full_name ?? ev.exam_registrations?.profiles?.email ?? "",
      event_type: ev.event_type,
      severity: ev.severity,
      message: ev.message ?? "",
      created_at: ev.created_at,
    }));
    exportToCSV(`integrity-${Date.now()}.csv`, rows, [
      { key: "id",         header: "Event ID" },
      { key: "exam",       header: "Exam" },
      { key: "candidate",  header: "Candidate" },
      { key: "event_type", header: "Event Type" },
      { key: "severity",   header: "Severity" },
      { key: "message",    header: "Message" },
      { key: "created_at", header: "Timestamp" },
    ]);
    return;
  }

  if (reportId === "student_transcript") {
    const { data, error } = await supabase
      .from("exam_registrations")
      .select("id, status, score, created_at, exams:exam_id(title, passing_score), profiles:candidate_id(email, full_name)")
      .eq("status", "completed");
    if (error) throw error;
    const rows = (data ?? []).map((r: any) => ({
      candidate: r.profiles?.full_name ?? r.profiles?.email ?? "",
      email: r.profiles?.email ?? "",
      exam: r.exams?.title ?? "",
      score: r.score ?? "",
      passing_score: (r.exams as any)?.passing_score ?? "",
      passed: typeof r.score === "number" && typeof (r.exams as any)?.passing_score === "number"
        ? r.score >= (r.exams as any).passing_score ? "Yes" : "No"
        : "",
      completed_at: r.created_at,
    }));
    exportToCSV(`transcripts-${Date.now()}.csv`, rows, [
      { key: "candidate",     header: "Candidate" },
      { key: "email",         header: "Email" },
      { key: "exam",          header: "Exam" },
      { key: "score",         header: "Score (%)" },
      { key: "passing_score", header: "Pass Mark (%)" },
      { key: "passed",        header: "Passed" },
      { key: "completed_at",  header: "Completed At" },
    ]);
    return;
  }

  if (reportId === "analytics_summary") {
    const [regResult, attemptResult] = await Promise.all([
      supabase.from("exam_registrations").select("status, score, exam_id"),
      supabase.from("exam_attempts").select("status"),
    ]);
    const regs = regResult.data ?? [];
    const completed = regs.filter((r) => r.status === "completed");
    const scores = completed.filter((r) => typeof r.score === "number").map((r) => r.score as number);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "N/A";
    const max = scores.length ? Math.max(...scores) : "N/A";
    const passRate = scores.length
      ? ((scores.filter((s) => s >= 60).length / scores.length) * 100).toFixed(1) + "%"
      : "N/A";
    const rows = [
      { metric: "Total Registrations",   value: regs.length },
      { metric: "Completed Exams",        value: completed.length },
      { metric: "Average Score",          value: avg },
      { metric: "Highest Score",          value: max },
      { metric: "Pass Rate (≥60%)",       value: passRate },
      { metric: "Total Attempts",         value: (attemptResult.data ?? []).length },
    ];
    exportToCSV(`analytics-summary-${Date.now()}.csv`, rows, [
      { key: "metric", header: "Metric" },
      { key: "value",  header: "Value" },
    ]);
    return;
  }
}

function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleGenerate = async (reportId: string, format: string) => {
    const key = `${reportId}-${format}`;
    setGenerating(key);
    try {
      await generateReport(reportId, dateFrom, dateTo);
      setDone((prev) => [...prev, reportId]);
      toast.success(`${format} report downloaded successfully.`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate report.");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <AdminShell
      title="Reports"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Reports" }]}
    >
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Date Range Filter
          </div>
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {REPORT_TYPES.map((report) => {
            const isDone = done.includes(report.id);
            return (
              <div key={report.id} className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
                <div
                  className="flex h-16 items-center gap-3 px-5"
                  style={{ background: NAVY }}
                >
                  <report.icon className="h-7 w-7 text-white" />
                  <p className="font-semibold text-white">{report.label}</p>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-sm text-muted-foreground">{report.desc}</p>

                  {isDone && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Downloaded successfully
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {report.formats.map((fmt) => {
                      const key = `${report.id}-${fmt}`;
                      const isGen = generating === key;
                      return (
                        <Button
                          key={fmt}
                          size="sm"
                          variant={isDone ? "default" : "outline"}
                          className="gap-1.5 text-xs h-8"
                          style={isDone ? { background: NAVY } : undefined}
                          disabled={!!generating}
                          onClick={() => handleGenerate(report.id, fmt)}
                        >
                          {isGen ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isDone ? (
                            <Download className="h-3.5 w-3.5" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                          {isGen ? "Generating…" : `${isDone ? "Re-download" : "Generate"} ${fmt}`}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <h3 className="text-sm font-semibold mb-2">Scheduled Reports</h3>
          <p className="text-sm text-muted-foreground">
            Configure automatic report delivery by going to{" "}
            <strong>Settings → Notifications</strong>. Reports can be scheduled daily, weekly, or monthly and delivered via email.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
