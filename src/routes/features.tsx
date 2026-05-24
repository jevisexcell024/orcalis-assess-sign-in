import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  GraduationCap,
  ShieldCheck,
  BrainCircuit,
  Video,
  Layers,
  Library,
  CalendarClock,
  BarChart3,
  Award,
  CreditCard,
  Users,
  Lock,
  FileText,
  Globe,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const Route = createFileRoute("/features")({
  component: FeaturesPage,
  head: () => ({
    meta: [
      { title: "Features — Orcalis Assess" },
      {
        name: "description",
        content:
          "Every Orcalis Assess feature — for the platform, the institutions that subscribe, and the students who take the exams.",
      },
      { property: "og:title", content: "Orcalis Assess — Full feature list" },
      {
        property: "og:description",
        content:
          "Exam builder, AI proctoring, live monitor, analytics, certificates, billing & more.",
      },
    ],
  }),
});

const platformPillars = [
  {
    icon: ShieldCheck,
    title: "Security & Compliance Core",
    items: [
      "End-to-end encryption (TLS 1.3 + AES-256 at rest)",
      "SOC 2 Type II, ISO 27001, GDPR & FERPA aligned",
      "Row-level security across every tenant",
      "Full audit logs for every action, exportable",
    ],
  },
  {
    icon: BrainCircuit,
    title: "Proctoring AI",
    items: [
      "Gaze, head-pose & multi-face detection",
      "Voice & background noise classification",
      "Prohibited-object & second-screen detection",
      "Browser lockdown + tab/window switch tracking",
    ],
  },
  {
    icon: Globe,
    title: "Global Infrastructure",
    items: [
      "Edge-deployed worldwide, <100ms median latency",
      "Auto-scales to 50,000 concurrent candidates",
      "99.99% uptime SLA on Enterprise",
      "Optional regional data residency (EU, US, APAC)",
    ],
  },
];

const orgFeatures = [
  { icon: Layers, title: "Exam Builder", body: "Drag-and-drop sections, weighted scoring, randomized item pools." },
  { icon: Library, title: "Question Bank", body: "Versioned items, multi-format (MCQ, essay, code, file upload)." },
  { icon: CalendarClock, title: "Scheduler", body: "Open / fixed / proctored windows, time zones, capacity caps." },
  { icon: Video, title: "Live Monitor", body: "Real-time proctor wall, flag & intervene without leaving the page." },
  { icon: BarChart3, title: "Analytics", body: "Score distributions, item analysis, cohort & longitudinal reports." },
  { icon: Award, title: "Certificates", body: "Auto-issued PDF certificates with QR verification URLs." },
  { icon: Users, title: "Roles & Org", body: "Super Admin, Proctor, Reviewer, Candidate — multi-campus support." },
  { icon: Lock, title: "SSO / SAML", body: "Google, Microsoft, Okta, custom SAML IdP, SCIM provisioning." },
  { icon: CreditCard, title: "Billing & Plans", body: "Self-serve subscriptions, invoices, seat / usage-based plans." },
  { icon: FileText, title: "Audit Logs", body: "Immutable activity trail for compliance and dispute resolution." },
];

const studentFeatures = [
  { title: "One-click check-in", body: "Camera, mic, network & ID verification in under 60 seconds." },
  { title: "Secure exam runner", body: "Distraction-free interface with auto-save every 5 seconds." },
  { title: "Practice library", body: "Unlimited mock tests in a non-proctored mode." },
  { title: "Instant results", body: "Auto-graded scores delivered the moment the exam closes." },
  { title: "Certificates & wallet", body: "Download or share verifiable certificates anywhere." },
  { title: "Multilingual UI", body: "12 languages with full RTL support." },
  { title: "Accessibility-first", body: "WCAG 2.2 AA, screen-reader optimized, extended time policies." },
  { title: "Payments & history", body: "Pay exam fees, view receipts, and replay past attempts." },
];

function FeaturesPage() {
  return (
    <MarketingShell>
      <header
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Full capability map
          </span>
          <h1 className="mt-5 max-w-3xl text-5xl font-extrabold tracking-tight">
            Every feature, for every role in the exam.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            What Orcalis Assess (the platform) provides, what your institution
            gets when it subscribes, and what students experience when they sit
            an exam.
          </p>
        </div>
      </header>

      <PillarSection />
      <RoleSection
        icon={Building2}
        tag="For institutions (the subscriber)"
        title="Run a complete examination operation"
        intro="Universities, certification boards, training providers, and enterprises get a full back-office to author, deliver, proctor, and analyze exams."
        features={orgFeatures}
      />
      <RoleSection
        icon={GraduationCap}
        tag="For students (the candidate)"
        title="A calm, fair, and accessible exam experience"
        intro="Candidates get a focused, low-friction interface designed to reduce anxiety while protecting the integrity of the exam."
        features={studentFeatures.map((f) => ({ ...f, icon: CheckCircle2 }))}
        tinted
      />
    </MarketingShell>
  );
}

function PillarSection() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
          Platform pillars
        </p>
        <h2 className="mt-2 text-4xl font-bold tracking-tight">
          What Orcalis Assess provides as the platform
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {platformPillars.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border p-6">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
              <ul className="mt-4 space-y-2">
                {p.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoleSection({
  icon: Icon,
  tag,
  title,
  intro,
  features,
  tinted,
}: {
  icon: typeof Building2;
  tag: string;
  title: string;
  intro: string;
  features: { icon: typeof Building2; title: string; body: string }[];
  tinted?: boolean;
}) {
  return (
    <section className={tinted ? "bg-[oklch(0.985_0.005_260)] py-24" : "border-y border-border bg-background py-24"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {tag}
          </span>
        </div>
        <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight">{title}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">{intro}</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-background p-5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}