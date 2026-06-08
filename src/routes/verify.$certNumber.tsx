import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck, Award, CheckCircle2, XCircle, Search,
  QrCode, Calendar, Building2, User, ExternalLink,
} from "lucide-react";
import { verifyCertificate } from "@/lib/certificates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/verify/$certNumber")({
  component: VerifyCertificatePage,
  head: () => ({ meta: [{ title: "Certificate Verification · Orcalis Assess" }] }),
});

function VerifyCertificatePage() {
  const { certNumber } = Route.useParams();
  const [search, setSearch] = useState(certNumber === "search" ? "" : certNumber);
  const [queried, setQueried] = useState(certNumber !== "search" ? certNumber : "");

  const { data: result, isLoading } = useQuery({
    queryKey: ["verify", queried],
    queryFn: () => verifyCertificate(queried),
    enabled: !!queried,
  });

  const handleSearch = () => setQueried(search.trim().toUpperCase());

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_260)] flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Orcalis Assess</span>
          </div>
          <span className="text-sm text-muted-foreground">Certificate Verification Portal</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Hero */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg mb-4" style={{ background: "var(--gradient-primary)" }}>
              <Award className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Certificate Verification</h1>
            <p className="mt-2 text-muted-foreground">
              Verify the authenticity of any Orcalis Assess certificate instantly.
            </p>
          </div>

          {/* Search box */}
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <label className="text-sm font-medium">Enter Certificate Number</label>
            <div className="mt-2 flex gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. CERT-A1B2C3D4"
                className="font-mono"
              />
              <Button onClick={handleSearch} disabled={!search.trim() || isLoading} className="gap-1.5 shrink-0">
                <Search className="h-4 w-4" />
                {isLoading ? "Checking…" : "Verify"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              The certificate number is printed on the certificate or available in the student's portal.
            </p>
          </div>

          {/* Result */}
          {queried && !isLoading && result && (
            <div className={cn(
              "rounded-2xl border p-6 shadow-sm space-y-5",
              result.valid ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40",
            )}>
              {/* Status banner */}
              <div className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3",
                result.valid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
              )}>
                {result.valid
                  ? <CheckCircle2 className="h-6 w-6 shrink-0" />
                  : <XCircle className="h-6 w-6 shrink-0" />}
                <div>
                  <p className="font-semibold text-base">
                    {result.valid ? "Certificate is Valid ✓" : "Certificate Not Found or Invalid"}
                  </p>
                  <p className="text-sm">
                    {result.valid
                      ? "This certificate was issued by Orcalis Assess and is authentic."
                      : "We could not find a valid certificate with this number. It may be revoked or incorrect."}
                  </p>
                </div>
              </div>

              {/* Certificate details */}
              {result.certificate && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: User,      label: "Holder",        value: result.student?.full_name ?? "–" },
                    { icon: QrCode,    label: "Certificate #", value: result.certificate.certificate_number },
                    { icon: Award,     label: "Examination",   value: result.exam?.title ?? "–" },
                    { icon: Building2, label: "Issued By",     value: result.organization?.name ?? "–" },
                    {
                      icon: Calendar,
                      label: "Issue Date",
                      value: new Date(result.certificate.issued_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
                    },
                    {
                      icon: Calendar,
                      label: "Expiry",
                      value: result.certificate.expires_at
                        ? new Date(result.certificate.expires_at).toLocaleDateString()
                        : "No expiry",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.certificate?.blockchain_hash && (
                <div className="rounded-xl border border-border bg-background p-4 text-xs font-mono text-muted-foreground break-all">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-1">Blockchain Hash</p>
                  {result.certificate.blockchain_hash}
                </div>
              )}
            </div>
          )}

          {/* How it works */}
          <div className="rounded-2xl border border-border bg-background p-5">
            <h3 className="text-sm font-semibold mb-3">About This Verification Portal</h3>
            <div className="grid gap-3 sm:grid-cols-3 text-xs text-muted-foreground">
              {[
                { icon: ShieldCheck, title: "Cryptographically Signed", desc: "Every certificate is hashed and anchored to a blockchain ledger." },
                { icon: QrCode,      title: "Instant Verification",      desc: "Scan any certificate QR code to be redirected here automatically." },
                { icon: ExternalLink,title: "Employer Trusted",          desc: "Share this URL with employers and institutions for official verification." },
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
      </main>

      <footer className="border-t border-border bg-background px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Orcalis Assess. All certificates verified on this portal are authentic and tamper-proof.
      </footer>
    </div>
  );
}
