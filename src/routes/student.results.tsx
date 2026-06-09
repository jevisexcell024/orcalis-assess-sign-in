import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Award, Download, TrendingUp, CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getMyCertificates, issueCertificate, type Certificate } from "@/lib/certificates";
import { exportToCSV } from "@/lib/csv";
import { toast } from "sonner";

export const Route = createFileRoute("/student/results")({
  component: StudentResultsPage,
  head: () => ({ meta: [{ title: "My Results · Orcalis Assess" }] }),
});

type Attempt = {
  id: string;
  score: number | null;
  max_score: number | null;
  auto_scored: boolean | null;
  submitted_at: string | null;
  exam_registrations: {
    id: string;
    status: string;
    exam_id: string;
    exams: { id: string; title: string; term: string | null } | null;
  } | null;
  results: { id: string; status: string } | null;
};

async function fetchMyResults(): Promise<Attempt[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("exam_attempts")
    .select(`
      id, score, max_score, auto_scored, submitted_at,
      exam_registrations (
        id, status, exam_id,
        exams ( id, title, term )
      ),
      results ( id, status )
    `)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false }) as { data: Attempt[] | null; error: unknown };

  if (error) {
    const { data: fallback, error: err2 } = await supabase
      .from("exam_attempts")
      .select(`id, score, max_score, auto_scored, submitted_at,
        exam_registrations ( id, status, exam_id, exams ( id, title, term ) )`)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false });
    if (err2) throw err2;
    return (fallback ?? []).map((a) => ({ ...a, results: null })) as unknown as Attempt[];
  }
  return data ?? [];
}

async function getStudentId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await (supabase as any)
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return data?.id ?? null;
}

function buildCertMap(certs: Certificate[]): Map<string, Certificate> {
  const m = new Map<string, Certificate>();
  for (const c of certs) {
    if (c.exam_id) m.set(c.exam_id, c);
  }
  return m;
}

function StudentResultsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [issuingId, setIssuingId] = useState<string | null>(null);

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["student", "results"],
    queryFn: fetchMyResults,
  });

  const { data: certs = [] } = useQuery({
    queryKey: ["student", "certificates"],
    queryFn: getMyCertificates,
  });

  const { data: studentId } = useQuery({
    queryKey: ["student", "id"],
    queryFn: getStudentId,
  });

  const certMap = buildCertMap(certs);

  const passed = attempts.filter((a) => a.max_score && (a.score ?? 0) / a.max_score >= 0.5);
  const avgPct = attempts.length
    ? attempts.reduce((s, a) => s + ((a.score ?? 0) / Math.max(a.max_score ?? 1, 1)) * 100, 0) / attempts.length
    : 0;

  const handleIssueCert = async (attempt: Attempt) => {
    const examId = attempt.exam_registrations?.exam_id;
    const resultId = (attempt as any).results?.id;
    if (!examId || !studentId) {
      toast.error("Cannot issue certificate — missing student or exam data.");
      return;
    }
    if (!resultId) {
      toast.error("Result not yet approved — certificate cannot be issued until the result is published.");
      return;
    }
    setIssuingId(attempt.id);
    try {
      const cert = await issueCertificate({ result_id: resultId, student_id: studentId, exam_id: examId });
      await qc.invalidateQueries({ queryKey: ["student", "certificates"] });
      toast.success("Certificate issued — redirecting to verification page.");
      void navigate({ to: "/verify/$certNumber", params: { certNumber: cert.certificate_number } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to issue certificate.");
    } finally {
      setIssuingId(null);
    }
  };

  const handleViewCert = (certNumber: string) => {
    window.open(`/verify/${certNumber}`, "_blank");
  };

  const handleDownloadTranscript = () => {
    exportToCSV(
      `transcript-${new Date().toISOString().slice(0, 10)}.csv`,
      attempts as any[],
      [
        { key: "exam_registrations.exams.title", header: "Exam" },
        { key: "exam_registrations.exams.term", header: "Term" },
        { key: "submitted_at", header: "Submitted At" },
        { key: "score", header: "Score" },
        { key: "max_score", header: "Max Score" },
      ]
    );
    toast.success("Transcript exported.");
  };

  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Results</h1>
            <p className="text-sm text-muted-foreground">Your complete examination history and scores.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTranscript}>
            <Download className="h-4 w-4" /> Download Transcript
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Total Exams",   value: attempts.length,         icon: TrendingUp,   cls: "text-foreground"  },
            { label: "Passed",        value: passed.length,           icon: CheckCircle2, cls: "text-emerald-700" },
            { label: "Average Score", value: `${avgPct.toFixed(1)}%`, icon: Award,        cls: "text-sky-700"     },
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
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
                    const didPass = pct >= 50;
                    const examId = a.exam_registrations?.exam_id;
                    const cert = examId ? certMap.get(examId) : undefined;
                    const issuing = issuingId === a.id;
                    return (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{a.exam_registrations?.exams?.title ?? "–"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{a.exam_registrations?.exams?.term ?? "–"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {a.submitted_at
                            ? new Date(a.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                            : "–"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div className={cn("h-full rounded-full", didPass ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold tabular-nums">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {didPass
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 className="h-3 w-3" /> Passed</span>
                            : <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200"><XCircle className="h-3 w-3" /> Failed</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!didPass ? (
                            <span className="text-xs text-muted-foreground">–</span>
                          ) : cert ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              onClick={() => handleViewCert(cert.certificate_number)}
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              disabled={issuing}
                              onClick={() => handleIssueCert(a)}
                            >
                              {issuing
                                ? <><Loader2 className="h-3 w-3 animate-spin" /> Issuing…</>
                                : <><Award className="h-3 w-3" /> Get Certificate</>
                              }
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Certificates carry a unique verification code.{" "}
          <a href="/student/certificates" className="underline hover:text-foreground">View all certificates →</a>
        </p>
      </div>
    </StudentShell>
  );
}
