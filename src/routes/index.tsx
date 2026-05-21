import { createFileRoute, redirect } from "@tanstack/react-router";
import { BrandingPanel } from "@/components/auth/BrandingPanel";
import { SignInForm } from "@/components/auth/SignInForm";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Sign in · Orcalis Assess" },
      {
        name: "description",
        content:
          "Sign in to Orcalis Assess — enterprise online examination and AI-powered remote proctoring for universities, certification bodies, and corporations.",
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

function Index() {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <BrandingPanel />
      <SignInForm />
    </main>
  );
}
