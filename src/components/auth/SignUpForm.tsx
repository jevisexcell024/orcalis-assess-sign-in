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
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signUpSchema, type SignUpValues } from "@/lib/auth-schema";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
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
        setSubmitError(error.message);
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
          className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10"
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Lock className="h-4 w-4" />
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
        className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Register for Orcalis Assess to manage exams, candidates, and proctoring workflows.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="institutionName" className="text-sm font-medium">
              Institution name
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

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
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
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••••••"
              aria-invalid={!!errors.confirmPassword}
              className={cn(
                "h-12 rounded-xl border-input text-sm",
                errors.confirmPassword && "border-destructive focus-visible:ring-destructive/40",
              )}
              {...register("confirmPassword")}
            />
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
                <a href="#" className="font-medium text-[color:var(--brand-blue)] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-[color:var(--brand-blue)] hover:underline">
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

          <Button
            type="submit"
            disabled={isSubmitting}
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
                <ArrowRight className="ml-2 h-4 w-4 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/" className="font-medium text-[color:var(--brand-blue)] hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </section>
  );
}

export default SignUpForm;