import { useState } from "react";
<<<<<<< Updated upstream
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Building2, User as UserIcon, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const schema = z
  .object({
    institutionName: z.string().trim().min(1, "Institution name is required").max(120),
    contactName: z.string().trim().min(1, "Your name is required").max(120),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  });

type Values = z.infer<typeof schema>;

export function SignUpForm() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    setSubmitError(null);
    setNotice(null);
    const redirectTo = `${window.location.origin}/dashboard`;
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
    } else {
      setNotice("Check your email to confirm your account, then sign in.");
=======
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Maximize2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: SignUpValues) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setSubmitError(error.message);
        return;
      }

      if (data.session || data.user) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/" });
      }
    } catch (error) {
      setSubmitError("Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
>>>>>>> Stashed changes
    }
  };

  return (
    <section className="relative flex min-h-screen flex-col bg-background px-6 py-10 sm:px-10 lg:px-16">
<<<<<<< Updated upstream
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Create your institution account</h2>
          <p className="mt-2 text-sm text-muted-foreground">Get your institution onboarded to Orcalis Assess.</p>
=======
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
>>>>>>> Stashed changes
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
<<<<<<< Updated upstream
            <Label htmlFor="institutionName">Institution name</Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="institutionName" placeholder="Stanford University" className={cn("h-12 rounded-xl pl-10", errors.institutionName && "border-destructive")} {...register("institutionName")} />
            </div>
            {errors.institutionName && <p className="text-xs text-destructive">{errors.institutionName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Your name</Label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="contactName" placeholder="Jane Doe" className={cn("h-12 rounded-xl pl-10", errors.contactName && "border-destructive")} {...register("contactName")} />
            </div>
            {errors.contactName && <p className="text-xs text-destructive">{errors.contactName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" autoComplete="email" placeholder="admin@institution.edu" className={cn("h-12 rounded-xl pl-10", errors.email && "border-destructive")} {...register("email")} />
=======
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
                className={cn("h-12 rounded-xl border-input pl-10 text-sm", errors.email && "border-destructive focus-visible:ring-destructive/40")}
                {...register("email")}
              />
>>>>>>> Stashed changes
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
<<<<<<< Updated upstream
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" className={cn("h-12 rounded-xl pl-10", errors.password && "border-destructive")} {...register("password")} />
=======
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
                className={cn("h-12 rounded-xl border-input px-10 text-sm", errors.password && "border-destructive focus-visible:ring-destructive/40")}
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
>>>>>>> Stashed changes
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
<<<<<<< Updated upstream
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="confirmPassword" type="password" autoComplete="new-password" className={cn("h-12 rounded-xl pl-10", errors.confirmPassword && "border-destructive")} {...register("confirmPassword")} />
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          {submitError && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{submitError}</div>}
          {notice && <div className="rounded-lg border border-emerald-300/50 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</div>}

          <Button type="submit" disabled={isSubmitting} className="group h-12 w-full rounded-xl text-sm font-semibold text-white shadow-lg" style={{ background: "var(--gradient-primary)" }}>
            {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</>) : (<>Create account<ArrowRight className="ml-2 h-4 w-4" /></>)}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/" className="font-medium text-[color:var(--brand-blue)] hover:underline">Sign in</Link>
        </p>
      </div>
    </section>
  );
}

export default SignUpForm;
=======
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••••••"
              aria-invalid={!!errors.confirmPassword}
              className={cn("h-12 rounded-xl border-input text-sm", errors.confirmPassword && "border-destructive focus-visible:ring-destructive/40")}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Controller
            control={control}
            name="remember"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <Checkbox checked={!!field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                <span className="text-muted-foreground">Remember this device</span>
              </label>
            )}
          />

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
      </motion.div>
    </section>
  );
}
>>>>>>> Stashed changes
