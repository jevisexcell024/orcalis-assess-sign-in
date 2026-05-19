import { createFileRoute } from "@tanstack/react-router";
import { BrandingPanel } from "@/components/auth/BrandingPanel";
import { SignInForm } from "@/components/auth/SignInForm";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Create account · Orcalis Assess" },
      {
        name: "description",
        content:
          "Create your Orcalis Assess account to access enterprise online examination and AI-powered remote proctoring.",
      },
    ],
  }),
});

function SignupPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <BrandingPanel />
      <SignInForm mode="signup" />
    </main>
  );
}