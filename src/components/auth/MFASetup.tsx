/**
 * MFA Setup Component
 * Handles TOTP enrollment flow: show QR → enter code → confirm
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Smartphone, CheckCircle2, Loader2,
  Trash2, AlertCircle, KeyRound, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  enrollTOTP, verifyTOTP, listFactors, unenrollTOTP,
  type TOTPFactor,
} from "@/lib/mfa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = "idle" | "qr" | "verify" | "done";

export function MFASetup() {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("idle");
  const [enrollment, setEnrollment] = useState<{
    id: string; qr_code: string; secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: factors = [], isLoading: factorsLoading } = useQuery({
    queryKey: ["mfa", "factors"],
    queryFn: listFactors,
  });

  const verifiedFactor = factors.find((f) => f.status === "verified");
  const isEnabled = !!verifiedFactor;

  const handleEnroll = async () => {
    setLoading(true); setError(null);
    try {
      const result = await enrollTOTP("Orcalis Assess");
      setEnrollment({ id: result.id, qr_code: result.totp.qr_code, secret: result.totp.secret });
      setStep("qr");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!enrollment || code.length < 6) return;
    setLoading(true); setError(null);
    try {
      await verifyTOTP(enrollment.id, code.replace(/\s/g, ""));
      await qc.invalidateQueries({ queryKey: ["mfa", "factors"] });
      setStep("done");
      toast.success("Two-factor authentication enabled!");
    } catch (e: any) {
      setError("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!verifiedFactor) return;
    setLoading(true); setError(null);
    try {
      await unenrollTOTP(verifiedFactor.id);
      await qc.invalidateQueries({ queryKey: ["mfa", "factors"] });
      setStep("idle");
      toast.success("Two-factor authentication disabled.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (factorsLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  }

  // ── Already enabled ────────────────────────────────────────────────────────
  if (isEnabled && step !== "done") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">2FA is enabled</p>
            <p className="text-sm text-emerald-700">
              Your account is protected with a time-based one-time password (TOTP) app.
            </p>
          </div>
        </div>
        {error && <ErrorBox msg={error} />}
        <Button variant="destructive" size="sm" onClick={handleDisable} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {loading ? "Disabling…" : "Disable 2FA"}
        </Button>
      </div>
    );
  }

  // ── Step: idle ─────────────────────────────────────────────────────────────
  if (step === "idle" || step === "done") {
    return (
      <div className="space-y-4">
        {step === "done" && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <p className="font-semibold text-emerald-800">2FA successfully enabled!</p>
          </div>
        )}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Authenticator App</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use Google Authenticator, Authy, or any TOTP app to generate 6-digit codes.
              </p>
            </div>
          </div>
        </div>
        {error && <ErrorBox msg={error} />}
        <Button onClick={handleEnroll} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          {loading ? "Setting up…" : "Set Up 2FA"}
        </Button>
      </div>
    );
  }

  // ── Step: show QR code ─────────────────────────────────────────────────────
  if (step === "qr" && enrollment) {
    return (
      <div className="space-y-5">
        <div>
          <p className="font-semibold">1. Scan this QR code</p>
          <p className="text-sm text-muted-foreground">Open your authenticator app and scan the code below.</p>
        </div>
        {/* QR code rendered from SVG data URL */}
        <div className="flex justify-center">
          <div className="rounded-2xl border-2 border-border bg-white p-4 shadow-sm">
            <div
              className="h-48 w-48"
              dangerouslySetInnerHTML={{ __html: enrollment.qr_code }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Manual entry key</p>
          <p className="font-mono text-sm break-all select-all">{enrollment.secret}</p>
        </div>
        {error && <ErrorBox msg={error} />}
        <Button onClick={() => setStep("verify")} className="w-full gap-1.5">
          <KeyRound className="h-4 w-4" /> Continue — Enter Code
        </Button>
      </div>
    );
  }

  // ── Step: verify code ─────────────────────────────────────────────────────
  if (step === "verify" && enrollment) {
    return (
      <div className="space-y-5">
        <div>
          <p className="font-semibold">2. Enter the 6-digit code</p>
          <p className="text-sm text-muted-foreground">
            Enter the code shown in your authenticator app to confirm setup.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="totp-code">Authentication Code</Label>
          <Input
            id="totp-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000 000"
            className="text-center text-2xl font-mono tracking-[0.5em] h-14"
            maxLength={6}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
        </div>
        {error && <ErrorBox msg={error} />}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep("qr")} disabled={loading}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleVerify} disabled={loading || code.length < 6} className="flex-1 gap-1.5">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : <><Shield className="h-4 w-4" /> Enable 2FA</>}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      {msg}
    </div>
  );
}
