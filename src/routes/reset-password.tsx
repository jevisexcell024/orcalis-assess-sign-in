import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth-schema";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Set new password · Orcalis Assess" },
      {
        name: "description",
        content: "Choose a new password for your Orcalis Assess account.",
      },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [authed, setAuthed] = useState<"checking" | "ok" | "invalid">("checking");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setAuthed(data.session ? "ok" : "invalid");
    })();
    return () => {
      active = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setSubmitError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setSuccess(true);
    await supabase.auth.signOut();
    setTimeout(() => navigate({ to: "/" }), 1500);
  };

  return (
    <section className="relative flex min-h-screen flex-col bg-background px-6 py-10 sm:px-10 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10"
      >
        {authed === "checking" ? (
          <div className="text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            <p className="mt-2">Verifying reset link…</p>
          </div>
        ) : authed === "invalid" ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Link expired or invalid</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your reset link is no longer valid. Request a new one from the forgot password page.
            </p>
            <Button
              onClick={() => navigate({ to: "/forgot-password" })}
              className="mt-6 h-11 rounded-xl text-sm font-semibold text-white shadow"
              style={{ background: "var(--gradient-primary)" }}
            >
              Request new link
            </Button>
          </div>
        ) : success ? (
          <div className="text-center">
            <div
              className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Password updated</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You can now sign in with your new password.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Set a new password</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick something strong — at least 8 characters.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  New password
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
                    errors.confirmPassword &&
                      "border-destructive focus-visible:ring-destructive/40",
                  )}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
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
                className="h-12 w-full rounded-xl text-sm font-semibold text-white shadow-lg disabled:opacity-80"
                style={{ background: "var(--gradient-primary)" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…
                  </>
                ) : (
                  <>
                    Update password
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </section>
  );
}