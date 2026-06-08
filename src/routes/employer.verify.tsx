import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Search, CheckCircle2, XCircle, Shield,
  User, Award, Calendar, GraduationCap, FileText, Loader2,
} from "lucide-react";
import { verifyCertificate } from "@/lib/certificates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employer/verify")({
  component: EmployerVerifyPage,
  head: () => ({
    meta: [
      { title: "Employer Verification Portal · Orcalis Assess" },
      { name: "description", content: "Verify candidate credentials, certificates, and academic records instantly." },
    ],
  }),
});

function EmployerVerifyPage() {
  const [certNumber, setCertNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [tab, setTab] = useState<"certificate" | "transcript">("certificate");
  const [queried, setQueried] = useState("");
  const [transcriptUrl, setTranscriptUrl] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  const { data: certResult, isLoading: certLoading } = useQuery({
    queryKey: ["employer-verify", queried],
    queryFn: () => verifyCertificate(queried),
    enabled: !!queried && tab === "certificate",
  });

  const handleCertSearch = () => {
    if (certNumber.trim()) setQueried(certNumber.trim().toUpperCase());
  };

  const handleTranscriptFetch = async () => {
    if (!studentId.trim()) return;
    setTranscriptLoading(true);
    try {
      const url = `/api/transcripts/generate?student_id=${encodeURIComponent(studentId.trim())}`;
      window.open(url, "_blank");
    } finally {
      setTranscriptLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_260)]">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight">Orcalis Assess</p>
              <p className="text-[11px] text-muted-foreground">Employer Verification Portal</p>
            </div>
          </div>
          <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
            Visit Platform →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg" style={{ background: "var(--gradient-primary)" }}>
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Credential Verification</h1>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            Instantly verify candidate certificates and academic transcripts issued by institutions on the Orcalis Assess platform.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 max-w-sm mx-auto">
          {([
            { id: "certificate", label: "Certificate",  icon: Award        },
            { id: "transcript",  label: "Transcript",   icon: GraduationCap },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setQueried(""); }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition",
                tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Certificate verification */}
        {tab === "certificate" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
              <div className="space-y-1.5">
                <Label>Certificate Number</Label>
                <div className="flex gap-3">
                  <Input
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleCertSearch()}
                    placeholder="e.g. CERT-A1B2C3D4"
                    className="font-mono"
                  />
                  <Button onClick={handleCertSearch} disabled={!certNumber.trim() || certLoading} className="gap-1.5 shrink-0">
                    {certLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    {certLoading ? "Checking…" : "Verify"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Ask the candidate to provide their certificate number from their Orcalis Assess portal.</p>
              </div>
            </div>

            {queried && !certLoading && certResult && (
              <div className={cn(
                "rounded-2xl border p-6 shadow-sm space-y-5",
                certResult.valid ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40",
              )}>
                <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3",
                  certResult.valid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>
                  {certResult.valid ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <XCircle className="h-6 w-6 shrink-0" />}
                  <div>
                    <p className="font-semibold">{certResult.valid ? "✓ Certificate is Authentic" : "✗ Certificate Invalid or Not Found"}</p>
                    <p className="text-sm">{certResult.valid ? "This credential was issued by Orcalis Assess and is verified." : "This certificate number does not match any record or may have been revoked."}</p>
                  </div>
                </div>

                {certResult.certificate && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { icon: User,      label: "Certificate Holder", value: certResult.student?.full_name ?? "–"             },
                      { icon: FileText,  label: "Student ID",         value: certResult.student?.student_number ?? "–"        },
                      { icon: Award,     label: "Examination",        value: certResult.exam?.title ?? "–"                    },
                      { icon: Building2, label: "Issuing Institution",value: certResult.organization?.name ?? "Orcalis Assess" },
                      { icon: Calendar,  label: "Issue Date",         value: new Date(certResult.certificate.issued_at).toLocaleDateString(undefined, { dateStyle: "long" }) },
                      { icon: Shield,    label: "Status",             value: certResult.valid ? "Valid & Active" : "Revoked"  },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                        <item.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-semibold">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Transcript verification */}
        {tab === "transcript" && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label>Student ID (provided by candidate)</Label>
              <div className="flex gap-3">
                <Input value={studentId} onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Student ID or UUID" className="font-mono" />
                <Button onClick={handleTranscriptFetch} disabled={!studentId.trim() || transcriptLoading} className="gap-1.5 shrink-0">
                  {transcriptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {transcriptLoading ? "Fetching…" : "Download Transcript"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The candidate must share their Student ID with you. Transcripts are official and tamper-evident.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Privacy Note</p>
              Transcript access is logged for audit purposes. Transcripts may only be accessed with the candidate's cooperation. Unauthorized access is prohibited.
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className="grid gap-4 sm:grid-cols-3 text-center">
          {[
            { icon: Shield,      title: "Cryptographically Signed",  desc: "All records are tamper-proof" },
            { icon: Building2,   title: "Institution Verified",       desc: "Only accredited institutions" },
            { icon: CheckCircle2,title: "Real-time Verification",     desc: "Instant, 24/7 availability"  },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <item.icon className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border bg-background px-6 py-4 text-center text-xs text-muted-foreground mt-8">
        © {new Date().getFullYear()} Orcalis Assess · Employer Verification Portal · All verifications are logged and audited.
      </footer>
    </div>
  );
}
