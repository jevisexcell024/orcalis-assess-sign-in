import { createFileRoute, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import AdminSignInForm from "@/components/auth/AdminSignInForm";
import { getSession, isAdminUser } from "@/lib/auth";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginRoute,
  head: () => ({
    meta: [
      { title: "Admin sign in · Orcalis Assess" },
      {
        name: "description",
        content: "Sign in with your administrator credentials to access the Orcalis Assess admin dashboard.",
      },
    ],
  }),
  // @ts-expect-error TanStack Router v1 beforeLoad type variance
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) return;

    if (await isAdminUser(session.user)) {
      return redirect({ to: "/admin" });
    }

    return redirect({ to: "/dashboard" });
  },
});

export default function AdminLoginRoute() {
  return (
    <section className="relative flex min-h-screen flex-col bg-background px-6 py-10 sm:px-10 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Admin sign in</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with your administrator account to access the dashboard.</p>
        </div>

        <AdminSignInForm />
      </motion.div>
    </section>
  );
}
