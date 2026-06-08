import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Download, ExternalLink, ShieldCheck, QrCode, Calendar } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { getMyCertificates } from "@/lib/certificates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/certificates")({
  component: StudentCertificatesPage,
  head: () => ({ meta: [{ title: "My Certificates · Orcalis Assess" }] }),
});

function StudentCertificatesPage() {
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["student", "certificates"],
    queryFn: getMyCertificates,
  });

  async function downloadCert(certId: string, certNumber: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Not authenticated."); return; }
    try {
      toast.info("Generating certificate PDF…");
      const res = await fetch(`/api/certificates/generate?cert_id=${certId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
        toast.error(err.error ?? "Failed to generate certificate.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${certNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificate downloaded.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    }
  }

  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Certificates</h1>
            <p className="text-sm text-muted-foreground">
              Download and share your verified digital certificates.
            </p>
          </div>
          <a
            href="/verify"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--brand-blue)] hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> Public Verification Portal
          </a>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background py-20 text-center">
            <Award className="h-14 w-14 text-muted-foreground/40" />
            <h3 className="mt-4 text-base font-semibold">No certificates yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Certificates are issued automatically when you pass and your result is approved.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {certs.map((cert) => {
              const exam = (cert as any).exams;
              const issuedDate = new Date(cert.issued_at).toLocaleDateString(undefined, {
                month: "long", day: "numeric", year: "numeric",
              });
              return (
                <div
                  key={cert.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition hover:shadow-md"
                >
                  {/* Gradient header */}
                  <div
                    className="flex h-28 items-center justify-center"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Award className="h-14 w-14 text-white/80" />
                    <div className="absolute right-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-semibold leading-snug">{exam?.title ?? "Certificate"}</h3>
                      {exam?.term && (
                        <p className="text-xs text-muted-foreground">{exam.term}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Issued {issuedDate}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-muted-foreground">{cert.certificate_number}</span>
                    </div>

                    {cert.expires_at && (
                      <div className="text-xs text-amber-600">
                        Expires {new Date(cert.expires_at).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1 gap-1.5 h-8 text-xs" onClick={() => downloadCert(cert.id, cert.certificate_number)}>
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </Button>
                      <a
                        href={`/verify/${cert.certificate_number}`}
                        target="_blank"
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium transition hover:bg-muted"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Verify
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How certificates work */}
        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <h3 className="text-sm font-semibold mb-3">How Verification Works</h3>
          <div className="grid gap-3 sm:grid-cols-3 text-xs text-muted-foreground">
            {[
              { icon: QrCode,      title: "QR Verification", desc: "Scan the QR code on any certificate to verify it instantly." },
              { icon: ShieldCheck, title: "Tamper-proof",    desc: "Each certificate is cryptographically signed and stored on our blockchain ledger." },
              { icon: ExternalLink,title: "Public Portal",   desc: "Share the verification link with employers or institutions." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" />
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
