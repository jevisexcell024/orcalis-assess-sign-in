import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Maximize2 } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signInSchema, type SignInValues } from "@/lib/auth-schema";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/auth";

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [isOauthSubmitting, setIsOauthSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (values: SignInValues) => {
    setSubmitError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        setSubmitError(error.message);
        return;
      }
      if (await isAdminUser(data.user)) {
        await supabase.auth.signOut();
        setSubmitError("Administrator accounts must sign in via the admin portal.");
        return;
      }
      navigate({ to: "/dashboard" });
    } catch {
      setSubmitError("Unable to sign in. Please try again.");
    }
  };

  const onOAuthSignIn = async (_provider: "azure" | "google") => {
    setOauthError("SSO is not available yet. Please sign in with email and password.");
  };

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
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please enter your details to sign in to your Orcalis Assess account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[color:var(--brand-blue)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Controller
            control={control}
            name="remember"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={(c) => field.onChange(!!c)}
                />
                <span className="text-muted-foreground">Remember this device</span>
              </label>
            )}
          />

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
            disabled={isSubmitting}
            className="group relative h-12 w-full overflow-hidden rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-80"
            style={{ background: "var(--gradient-primary)" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              <>
                Sign in to dashboard
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
              Or continue with SSO
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isOauthSubmitting}
            onClick={() => onOAuthSignIn("azure")}
            className="h-11 rounded-xl border-border bg-background text-sm font-medium hover:bg-muted"
          >
            <MicrosoftIcon className="mr-2 h-4 w-4" /> Microsoft 365
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isOauthSubmitting}
            onClick={() => onOAuthSignIn("google")}
            className="h-11 rounded-xl border-border bg-background text-sm font-medium hover:bg-muted"
          >
            <GoogleIcon className="mr-2 h-4 w-4" /> Google Workspace
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <Link to="/signup" className="font-medium text-[color:var(--brand-blue)] hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>

      <footer className="mt-auto flex items-center justify-center gap-2 pt-6 text-xs text-muted-foreground">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        SOC 2 Type II Certified <span className="opacity-50">•</span> End-to-End Encrypted
      </footer>
    </section>
  );
}