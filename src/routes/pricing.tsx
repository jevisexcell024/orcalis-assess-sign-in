import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X, Sparkles } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Orcalis Assess" },
      {
        name: "description",
        content:
          "Transparent pricing for Orcalis Assess. Plans from Starter to Enterprise — pay per active candidate, with AI proctoring included.",
      },
      { property: "og:title", content: "Orcalis Assess Pricing" },
      {
        property: "og:description",
        content:
          "Starter, Professional, Business, and Enterprise plans with AI proctoring, analytics and certificates.",
      },
    ],
  }),
});

type Plan = {
  name: string;
  tagline: string;
  price: string;
  unit: string;
  cta: string;
  to: string;
  highlight?: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "For small classes & first pilots",
    price: "$0",
    unit: "free forever · up to 50 exams/mo",
    cta: "Get started",
    to: "/signup",
    features: [
      "Up to 25 active candidates / month",
      "Basic auto-proctoring (tab-switch, copy-paste)",
      "Exam builder, question bank, 5 templates",
      "Auto-grading for objective items",
      "Email support",
    ],
  },
  {
    name: "Professional",
    tagline: "For growing schools & training providers",
    price: "$1.20",
    unit: "per candidate / exam",
    cta: "Start 14-day trial",
    to: "/signup",
    highlight: true,
    features: [
      "Unlimited candidates & exams",
      "AI behavioral proctoring (gaze, audio, objects)",
      "Live proctor console (up to 25 concurrent)",
      "Advanced analytics & item analysis",
      "Branded certificates with verification URLs",
      "Priority email + chat support",
    ],
  },
  {
    name: "Business",
    tagline: "For universities & certification bodies",
    price: "$0.90",
    unit: "per candidate · volume pricing",
    cta: "Talk to sales",
    to: "/contact",
    features: [
      "Everything in Professional",
      "Multi-campus / multi-department orgs",
      "SSO (Google, Microsoft, SAML)",
      "Role-based access (Admin / Proctor / Reviewer)",
      "White-label branding & custom domain",
      "API access & LMS integrations (Moodle, Canvas, Blackboard)",
      "99.9% uptime SLA",
    ],
  },
  {
    name: "Enterprise",
    tagline: "For nation-wide boards & enterprises",
    price: "Custom",
    unit: "annual contract",
    cta: "Contact sales",
    to: "/contact",
    features: [
      "Everything in Business",
      "Dedicated infrastructure & data residency",
      "Custom AI model tuning per exam type",
      "Human-proctor marketplace at scale",
      "Dedicated CSM, onboarding & training",
      "Custom DPA, SOC 2 reports, FERPA, GDPR",
      "99.99% uptime SLA + 24/7 phone support",
    ],
  },
];

function PricingPage() {
  return (
    <MarketingShell>
      <section className="border-b border-border bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground/80">
            <Sparkles className="h-3.5 w-3.5" /> 14-day free trial · no credit card
          </span>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Pay only for what you proctor. Every plan includes our secure exam
            engine, candidate dashboard, and core auto-proctoring.
          </p>
        </div>
      </section>

      <section className="bg-[oklch(0.985_0.005_260)] py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {plans.map((p) => (
            <PlanCard key={p.name} plan={p} />
          ))}
        </div>
      </section>

      <ComparisonTable />
      <FAQ />
    </MarketingShell>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-7 transition",
        plan.highlight
          ? "border-transparent bg-background shadow-xl ring-2 ring-[oklch(0.5_0.224_290)]"
          : "border-border bg-background hover:shadow-md",
      )}
    >
      {plan.highlight && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-md"
          style={{ background: "var(--gradient-primary)" }}
        >
          Most popular
        </span>
      )}
      <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      <div className="mt-6">
        <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
        <p className="mt-1 text-xs text-muted-foreground">{plan.unit}</p>
      </div>
      <Button
        asChild
        className={cn(
          "mt-6 rounded-lg",
          plan.highlight && "text-white shadow-md",
        )}
        variant={plan.highlight ? "default" : "outline"}
        style={plan.highlight ? { background: "var(--gradient-primary)" } : undefined}
      >
        <Link to={plan.to}>{plan.cta}</Link>
      </Button>
      <ul className="mt-7 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const matrix: { feature: string; tiers: (boolean | string)[] }[] = [
  { feature: "Active candidates / month", tiers: ["25", "Unlimited", "Unlimited", "Unlimited"] },
  { feature: "Exam builder & question bank", tiers: [true, true, true, true] },
  { feature: "Auto-grading (objective)", tiers: [true, true, true, true] },
  { feature: "Manual grading workflows", tiers: [false, true, true, true] },
  { feature: "AI behavioral proctoring", tiers: [false, true, true, true] },
  { feature: "Live proctor console", tiers: [false, "25 concurrent", "200 concurrent", "Unlimited"] },
  { feature: "Analytics & item analysis", tiers: ["Basic", "Advanced", "Advanced", "Custom"] },
  { feature: "Verifiable certificates", tiers: [false, true, true, true] },
  { feature: "SSO / SAML", tiers: [false, false, true, true] },
  { feature: "Multi-campus org", tiers: [false, false, true, true] },
  { feature: "White-label & custom domain", tiers: [false, false, true, true] },
  { feature: "LMS integrations (Moodle, Canvas)", tiers: [false, false, true, true] },
  { feature: "Dedicated infrastructure", tiers: [false, false, false, true] },
  { feature: "Data residency", tiers: [false, false, false, true] },
  { feature: "Uptime SLA", tiers: ["—", "99.5%", "99.9%", "99.99%"] },
  { feature: "Support", tiers: ["Email", "Priority", "Priority + CSM", "24/7 + CSM"] },
];

function ComparisonTable() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight">Compare plans</h2>
        <p className="mt-2 text-muted-foreground">
          Everything Orcalis Assess offers — side by side.
        </p>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">Feature</th>
                {plans.map((p) => (
                  <th key={p.name} className="px-4 py-4 text-left font-semibold">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={row.feature} className={cn(i % 2 && "bg-muted/30")}>
                  <td className="px-4 py-3 font-medium text-foreground/90">
                    {row.feature}
                  </td>
                  {row.tiers.map((v, idx) => (
                    <td key={idx} className="px-4 py-3 text-foreground/80">
                      {typeof v === "boolean" ? (
                        v ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50" />
                        )
                      ) : (
                        <span>{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "How is pricing calculated?",
    a: "Professional and Business plans are priced per active candidate per exam — a candidate is only billed once they actually start an exam. Starter is free up to 25 active candidates / month. Enterprise is a custom annual contract.",
  },
  {
    q: "Do you offer education discounts?",
    a: "Yes. Accredited universities, K-12 boards, and registered non-profits get up to 40% off Business and Enterprise plans. Contact sales for details.",
  },
  {
    q: "Can I switch plans later?",
    a: "Anytime. Upgrades take effect immediately; downgrades take effect at the next billing cycle. Your data and exams are never lost.",
  },
  {
    q: "What about human proctoring?",
    a: "AI proctoring is included in Professional+. Live human proctors (record-and-review or fully-live) can be added on any paid plan starting at $4.50 per session.",
  },
];

function FAQ() {
  return (
    <section className="border-t border-border bg-[oklch(0.985_0.005_260)] py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        <div className="mt-10 space-y-4">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-border bg-background p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between font-semibold">
                {f.q}
                <span className="text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}