import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/auth";
import { adminSignInSchema, type AdminSignInValues } from "@/lib/auth-schema";
import { toFriendlyAuthError } from "@/lib/auth-errors";

export function AdminSignInForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminSignInValues>({
    resolver: zodResolver(adminSignInSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (values: AdminSignInValues) => {
    setSubmitError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setSubmitError(toFriendlyAuthError(error, "signIn"));
        return;
      }

      if (!(await isAdminUser(data.user))) {
        await supabase.auth.signOut();
        setSubmitError("This account does not have administrator access.");
        return;
      }

      navigate({ to: "/admin" });
    } catch (e) {
      setSubmitError("Unable to sign in. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Admin email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" type="email" placeholder="admin@institution.edu" className={cn("h-12 rounded-xl border-input pl-10 text-sm", errors.email && "border-destructive")} {...register("email")} />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="password" type="password" placeholder="••••••••" className={cn("h-12 rounded-xl border-input px-10 text-sm", errors.password && "border-destructive")} {...register("password")} />
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <Checkbox {...register("remember")} defaultChecked />
          <span className="text-muted-foreground">Remember admin session</span>
        </label>
      </div>

      {submitError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {submitError}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="group relative h-12 w-full overflow-hidden rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-80" style={{ background: "var(--gradient-primary)" }}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          <>
            Sign in as admin
            <ArrowRight className="ml-2 h-4 w-4 transition-transform" />
          </>
        )}
      </Button>
    </form>
  );
}

export default AdminSignInForm;
