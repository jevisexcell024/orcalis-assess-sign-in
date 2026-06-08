import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Download, Filter, BarChart2, Users2,
  GraduationCap, Award, CalendarDays, Loader2, CheckCircle2,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports · Orcalis Assess" }] }),
});

const REPORT_TYPES = [
  {
    id: "exam_results",
    label: "Exam Results Report",
    desc: "Detailed breakdown of all exam scores, grades and pass rates per exam.",
    icon: BarChart2,
    formats: ["CSV", "XLSX", "PDF"],
    color: "from-sky-400 to-indigo-500",
  },
  {
    id: "candidate_report",
    label: "Candidate Report",
    desc: "List of all registered candidates with status, scores and eligibility.",
    icon: Users2,
    formats: ["CSV", "XLSX", "PDF"],
    color: "from-violet-400 to-purple-600",
  },
  {
    id: "attendance_report",
    label: "Attendance Report",
    desc: "Session-level attendance rates, absentees and late check-ins.",
    icon: CalendarDays,
    formats: ["CSV", "XLSX"],
    color: "from-emerald-400 to-teal-600",
  },
  {
    id: "academic_integrity",
    label: "Integrity Report",
    desc: "Summary of all AI and plagiarism flags, cleared and unresolved cases.",
    icon: Award,
    formats: ["CSV", "PDF"],
    color: "from-rose-400 to-pink-600",
  },
  {
    id: "student_transcript",
    label: "Student Transcripts",
    desc: "Official academic transcripts for a student or entire cohort.",
    icon: GraduationCap,
    formats: ["PDF"],
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "analytics_summary",
    label: "Analytics Summary",
    desc: "Platform-wide KPIs: active exams, candidate throughput, score distributions.",
    icon: BarChart2,
    formats: ["PDF", "XLSX"],
    color: "from-sky-500 to-cyan-600",
  },
];

function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleGenerate = async (reportId: string, format: string) => {
    setGenerating(`${reportId}-${format}`);
    await new Promise((r) => setTimeout(r, 1800));
    setGenerating(null);
    setDone((prev) => [...prev, reportId]);
    toast.success(`${format} report generated and ready to download.`);
  };

  return (
    <AdminShell
      title="Reports"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Reports" }]}
    >
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        {/* Date range filter */}
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

        {/* Report cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {REPORT_TYPES.map((report) => {
            const isDone = done.includes(report.id);
            return (
              <div key={report.id} className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
                {/* Color header */}
                <div className={cn("flex h-16 items-center gap-3 px-5 bg-gradient-to-r", report.color)}>
                  <report.icon className="h-7 w-7 text-white" />
                  <p className="font-semibold text-white">{report.label}</p>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-sm text-muted-foreground">{report.desc}</p>

                  {isDone && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Ready to download
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
                          {isGen ? "Generating…" : `${isDone ? "Download" : "Generate"} ${fmt}`}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scheduled reports note */}
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
