import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Download, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";


function downloadCertificate(examTitle: string, term: string | null, score: number, submittedAt: string) {
  const date = new Date(submittedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  const certNo = `ORC-${Date.now().toString(36).toUpperCase()}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Certificate – ${examTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .cert { width: 820px; min-height: 580px; border: 12px solid #1e3a8a; padding: 56px 72px; position: relative; text-align: center; }
  .cert::before { content: ''; position: absolute; inset: 8px; border: 2px solid #93c5fd; pointer-events: none; }
  .logo { font-size: 13px; letter-spacing: .2em; text-transform: uppercase; color: #1e3a8a; font-weight: 600; }
  h1 { font-family: 'Playfair Display', serif; font-size: 40px; color: #1e3a8a; margin: 24px 0 8px; }
  .sub { font-size: 14px; color: #64748b; letter-spacing: .05em; }
  .name-line { font-family: 'Playfair Display', serif; font-size: 28px; color: #0f172a; margin: 32px 0 8px; border-bottom: 2px solid #1e3a8a; display: inline-block; padding: 0 32px 8px; }
  .exam { font-size: 18px; color: #1e3a8a; font-weight: 500; margin: 16px 0 4px; }
  .term { font-size: 13px; color: #64748b; }
  .score { display: inline-block; margin: 24px 0; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 24px; font-weight: 600; color: #1e40af; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 48px; }
  .sig { text-align: center; }
  .sig-line { width: 140px; border-top: 1px solid #94a3b8; margin-bottom: 6px; }
  .sig-label { font-size: 11px; color: #64748b; }
  .cert-no { font-size: 10px; color: #94a3b8; letter-spacing: .1em; }
  @media print { body { min-height: unset; } }
</style>
</head>
<body>
<div class="cert">
  <div class="logo">Orcalis Assess · Certificate of Achievement</div>
  <h1>Certificate of Achievement</h1>
  <p class="sub">This is to certify that the candidate has successfully completed</p>
  <div class="exam">${examTitle}</div>
  ${term ? `<div class="term">${term}</div>` : ""}
  <div class="score">Score: ${score}% &nbsp;·&nbsp; Pass</div>
  <div class="footer">
    <div class="sig"><div class="sig-line"></div><div class="sig-label">Authorised Signatory</div></div>
    <div style="text-align:center">
      <div style="font-size:11px;color:#64748b">Issued: ${date}</div>
      <div class="cert-no">No. ${certNo}</div>
    </div>
    <div class="sig"><div class="sig-line"></div><div class="sig-label">Institution Seal</div></div>
  </div>
</div>
<script>window.onload=()=>{window.print();}</script>
</body>
</html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export const Route = createFileRoute("/student/results")({
  component: StudentResultsPage,
  head: () => ({ meta: [{ title: "My Results · Orcalis Assess" }] }),
});

async function fetchMyResults() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("exam_attempts")
    .select(`
      id, score, max_score, auto_scored, submitted_at,
      exam_registrations (
        id, status, created_at,
        exams ( id, title, term )
      )
    `)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function StudentResultsPage() {
  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["student", "results"],
    queryFn: fetchMyResults,
  });

  const passed = attempts.filter((a) => a.max_score && (a.score ?? 0) / a.max_score >= 0.5);
  const avgPct = attempts.length
    ? attempts.reduce((s, a) => s + ((a.score ?? 0) / Math.max(a.max_score ?? 1, 1)) * 100, 0) / attempts.length
    : 0;

  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Results</h1>
            <p className="text-sm text-muted-foreground">Your complete examination history and scores.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" /> Download Transcript</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Total Exams",   value: attempts.length,        icon: TrendingUp,   cls: "text-foreground"  },
            { label: "Passed",        value: passed.length,          icon: CheckCircle2, cls: "text-emerald-700" },
            { label: "Average Score", value: `${avgPct.toFixed(1)}%`,icon: Award,        cls: "text-sky-700"     },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={cn("mt-1 text-2xl font-bold", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Exam</th>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 text-right font-medium">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">Loading results…</td></tr>
              ) : attempts.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">No completed exams yet.</td></tr>
              ) : (
                attempts.map((a) => {
                  const pct = a.max_score ? Math.round((a.score ?? 0) / a.max_score * 100) : 0;
                  const passed = pct >= 50;
                  return (
                    <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{(a as any).exam_registrations?.exams?.title ?? "–"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{(a as any).exam_registrations?.exams?.term ?? "–"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "–"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div className={cn("h-full rounded-full", passed ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold tabular-nums">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {passed
                          ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 className="h-3 w-3" /> Passed</span>
                          : <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200"><XCircle className="h-3 w-3" /> Failed</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        {passed
                          ? <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => downloadCertificate(
                            (a as any).exam_registrations?.exams?.title ?? "Exam",
                            (a as any).exam_registrations?.exams?.term ?? null,
                            pct,
                            a.submitted_at ?? new Date().toISOString(),
                          )}
                        >
                          <Download className="h-3 w-3" /> Download
                        </Button>
                          : <span className="text-xs text-muted-foreground">–</span>
                        }
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StudentShell>
  );
}
