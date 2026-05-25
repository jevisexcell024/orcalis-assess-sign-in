import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Maximize2,
  Building2,
  User,
  MailCheck,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signUpSchema, type SignUpValues } from "@/lib/auth-schema";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toFriendlyAuthError } from "@/lib/auth-errors";

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.05 12.04c-.03-2.78 2.27-4.12 2.38-4.18-1.3-1.9-3.32-2.16-4.04-2.19-1.72-.17-3.36 1.01-4.23 1.01-.88 0-2.22-.99-3.65-.96-1.88.03-3.61 1.09-4.58 2.77-1.96 3.39-.5 8.4 1.4 11.15.93 1.35 2.03 2.86 3.47 2.81 1.4-.06 1.93-.9 3.62-.9 1.69 0 2.16.9 3.63.87 1.5-.03 2.45-1.37 3.36-2.73 1.06-1.56 1.5-3.07 1.52-3.15-.03-.01-2.91-1.12-2.94-4.4zM14.3 4.07c.77-.93 1.29-2.23 1.15-3.52-1.11.04-2.46.74-3.26 1.67-.71.82-1.34 2.14-1.17 3.41 1.24.1 2.5-.63 3.28-1.56z"/>
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  const labels = ["Too short", "Weak", "Fair", "Strong", "Excellent"] as const;
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [isOauthSubmitting, setIsOauthSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      institutionName: "",
      contactName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
    },
  });

  const acceptTerms = watch("acceptTerms");
  const passwordValue = watch("password") ?? "";
  const strength = passwordStrength(passwordValue);

  const onOAuthSignUp = async (provider: "google" | "apple") => {
    setOauthError(null);
    setIsOauthSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/auth-callback`,
      });
      if (result.error) {
        setOauthError(toFriendlyAuthError(result.error, "oauth"));
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch {
      setOauthError("Unable to start SSO sign-up. Please try again.");
    } finally {
      setIsOauthSubmitting(false);
    }
  };

  const onSubmit = async (values: SignUpValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/auth-callback`;
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            institution_name: values.institutionName,
            contact_name: values.contactName,
          },
        },
      });
      if (error) {
        setSubmitError(toFriendlyAuthError(error, "signUp"));
        return;
      }
      if (data.session) {
        navigate({ to: "/dashboard" });
        return;
      }
      setSubmittedEmail(values.email);
    } catch {
      setSubmitError("Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!submittedEmail) return;
    setResendState("sending");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: submittedEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth-callback` },
    });
    setResendState(error ? "error" : "sent");
  };

  if (submittedEmail) {
    return (
      <section className="relative flex min-h-screen flex-col bg-background px-6 py-10 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex w-full max-w-110 flex-1 flex-col justify-center py-10"
        >
          <div
            className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            <MailCheck className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Check your inbox</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>. Click it to
            activate your account, then sign in.
          </p>

          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Didn't get it?</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>Check your spam or junk folder.</li>
              <li>Confirm the email address is spelled correctly.</li>
              <li>Wait a minute — delivery can take a moment.</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onResend}
              disabled={resendState === "sending" || resendState === "sent"}
              className="h-11 flex-1 rounded-xl text-sm font-medium"
            >
              {resendState === "sending" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                </>
              ) : resendState === "sent" ? (
                "Email sent ✓"
              ) : resendState === "error" ? (
                "Try again"
              ) : (
                "Resend confirmation"
              )}
            </Button>
            <Button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="h-11 flex-1 rounded-xl text-sm font-semibold text-white shadow"
              style={{ background: "var(--gradient-primary)" }}
            >
              Go to sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {resendState === "error" && (
            <p className="mt-3 text-xs text-destructive">
              Couldn't resend the email. Please try again in a moment.
            </p>
          )}
        </motion.div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-screen flex-col bg-background px-6 py-10 sm:px-10 lg:px-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 lg:invisible">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight">Orcalis Assess</span>
        </div>
        <button
          type="button"
          aria-label="Toggle fullscreen"
          className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
            else document.exitFullscreen?.();
          }}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex w-full max-w-120 flex-1 flex-col justify-center py-10"
      >
        <div className="mb-7">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Free 14-day trial · No card required
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up your institution workspace to run secure exams and AI proctoring.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="institutionName" className="text-sm font-medium">
                Institution
              </Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="institutionName"
                  type="text"
                  autoComplete="organization"
                  placeholder="State University"
                  aria-invalid={!!errors.institutionName}
                  className={cn(
                    "h-12 rounded-xl border-input pl-10 text-sm",
                    errors.institutionName && "border-destructive focus-visible:ring-destructive/40",
                  )}
                  {...register("institutionName")}
                />
              </div>
              {errors.institutionName && (
                <p className="text-xs text-destructive">{errors.institutionName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName" className="text-sm font-medium">
                Contact name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contactName"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  aria-invalid={!!errors.contactName}
                  className={cn(
                    "h-12 rounded-xl border-input pl-10 text-sm",
                    errors.contactName && "border-destructive focus-visible:ring-destructive/40",
                  )}
                  {...register("contactName")}
                />
              </div>
              {errors.contactName && (
                <p className="text-xs text-destructive">{errors.contactName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Work email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@institution.edu"
                aria-invalid={!!errors.email}
                className={cn(
                  "h-12 rounded-xl border-input pl-10 text-sm",
                  errors.email && "border-destructive focus-visible:ring-destructive/40",
                )}
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••••••"
                aria-invalid={!!errors.password}
                className={cn(
                  "h-12 rounded-xl border-input px-10 text-sm",
                  errors.password && "border-destructive focus-visible:ring-destructive/40",
                )}
                {...register("password")}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordValue.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i < strength.score
                          ? strength.score <= 1
                            ? "bg-destructive"
                            : strength.score === 2
                              ? "bg-amber-500"
                              : strength.score === 3
                                ? "bg-sky-500"
                                : "bg-emerald-500"
                          : "bg-muted",
                      )}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Password strength:{" "}
                  <span className="font-medium text-foreground">{strength.label}</span>
                </p>
              </div>
            )}
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••••••"
                aria-invalid={!!errors.confirmPassword}
                className={cn(
                  "h-12 rounded-xl border-input pl-10 text-sm",
                  errors.confirmPassword && "border-destructive focus-visible:ring-destructive/40",
                )}
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <Checkbox
                checked={!!acceptTerms}
                onCheckedChange={(c) =>
                  setValue(
                    "acceptTerms",
                    c === true ? (true as const) : (false as unknown as true),
                    { shouldValidate: true },
                  )
                }
                className="mt-0.5"
              />
              <span className="text-muted-foreground">
                I agree to the{" "}
                <a href="#" className="font-medium text-(--brand-blue) hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-(--brand-blue) hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-xs text-destructive">{errors.acceptTerms.message as string}</p>
            )}
          </div>

          {submitError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {submitError}
            </div>
          )}

          {oauthError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {oauthError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || isOauthSubmitting}
            className="group relative h-12 w-full overflow-hidden rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-80"
            style={{ background: "var(--gradient-primary)" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Create account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
        </form>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
              Or sign up with SSO
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isOauthSubmitting}
            onClick={() => onOAuthSignUp("google")}
            className="h-11 rounded-xl border-border bg-background text-sm font-medium hover:bg-muted"
          >
            <GoogleIcon className="mr-2 h-4 w-4" /> Google
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isOauthSubmitting}
            onClick={() => onOAuthSignUp("apple")}
            className="h-11 rounded-xl border-border bg-background text-sm font-medium hover:bg-muted"
          >
            <AppleIcon className="mr-2 h-4 w-4" /> Apple
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/" className="font-medium text-(--brand-blue) hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>

      <footer className="mt-auto flex items-center justify-center gap-2 pt-6 text-xs text-muted-foreground">
        <Check className="h-3 w-3 text-emerald-500" />
        SOC 2 Type II Certified <span className="opacity-50">•</span> GDPR &amp; FERPA Compliant
      </footer>
    </section>
  );
}

export default SignUpForm;