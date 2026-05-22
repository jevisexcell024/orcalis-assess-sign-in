import { useState } from "react";
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
    }
  };

  return (
    <section className="relative flex min-h-screen flex-col bg-background px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Create your institution account</h2>
          <p className="mt-2 text-sm text-muted-foreground">Get your institution onboarded to Orcalis Assess.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
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
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" className={cn("h-12 rounded-xl pl-10", errors.password && "border-destructive")} {...register("password")} />
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
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