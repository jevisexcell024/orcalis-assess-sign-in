import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { BrandingPanel } from "@/components/auth/BrandingPanel";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  head: () => ({
    meta: [
      { title: "Sign up · Orcalis Assess" },
      {
        name: "description",
        content:
          "Create a new Orcalis Assess account to manage exams, proctoring, and candidate workflows.",
      },
    ],
  }),
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      return redirect({ to: "/dashboard" });
    }
  },
});

function SignUpPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <BrandingPanel />
      <SignUpForm />
    </main>
  );
}
