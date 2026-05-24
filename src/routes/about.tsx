import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Sparkles, Target, Globe2, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — Orcalis Assess" },
      {
        name: "description",
        content:
          "Orcalis Assess is on a mission to make high-stakes online examinations as trustworthy as the best in-person testing centers.",
      },
      { property: "og:title", content: "About Orcalis Assess" },
      {
        property: "og:description",
        content:
          "Our mission, our story, and the institutions we serve.",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <MarketingShell>
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Our mission
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight">
            Examinations the world can trust.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Orcalis Assess exists to make high-stakes online testing as
            credible, secure, and accessible as the best in-person testing
            centers — without the cost, friction, or geographical limits.
          </p>
        </div>
      </section>

      <section className="bg-background py-24">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            { icon: Target, title: "Integrity first", body: "Every product decision is judged against the question: does this make cheating easier or harder?" },
            { icon: Globe2, title: "Built for the world", body: "From small classrooms in Lagos to national boards in India — multi-language, multi-region, multi-currency." },
            { icon: Users, title: "Candidate-centric", body: "Accessibility, mental health, and fairness are baked into the candidate UX, not bolted on." },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl border border-border p-6">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-[oklch(0.985_0.005_260)] py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            { v: "2023", l: "Founded" },
            { v: "60+", l: "Countries served" },
            { v: "12M+", l: "Exams delivered" },
            { v: "120", l: "Team members" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-4xl font-extrabold tracking-tight">{s.v}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}