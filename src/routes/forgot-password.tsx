import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { Mail, Loader2, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth-schema";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password · Orcalis Assess" },
      {
        name: "description",
        content: "Request a password reset link for your Orcalis Assess account.",
      },
    ],
  }),
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setSubmitError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth-callback`,
    });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setSentTo(values.email);
  };

  return (
    <section className="relative flex min-h-screen flex-col bg-background px-6 py-10 sm:px-10 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10"
      >
        {sentTo ? (
          <>
            <div
              className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <MailCheck className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Check your inbox</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for{" "}
              <span className="font-medium text-foreground">{sentTo}</span>, we've sent a password
              reset link. The link expires in 1 hour.
            </p>
            <Button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="mt-6 h-11 rounded-xl text-sm font-semibold text-white shadow"
              style={{ background: "var(--gradient-primary)" }}
            >
              Back to sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Forgot your password?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email and we'll send you a secure link to reset it.
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending link…
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <Link
              to="/"
              className="mt-8 inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </>
        )}
      </motion.div>
    </section>
  );
}