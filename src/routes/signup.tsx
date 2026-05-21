import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const Route = createFileRoute("/signup")({
  component: SignUpForm,
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
