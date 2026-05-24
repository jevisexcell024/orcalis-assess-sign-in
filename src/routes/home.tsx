import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Eye,
  BrainCircuit,
  Video,
  Award,
  BarChart3,
  Building2,
  GraduationCap,
  Layers,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/home")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Orcalis Assess — Secure AI Proctoring & Online Examinations" },
      {
        name: "description",
        content:
          "Run secure, AI-proctored online exams at any scale. Orcalis Assess powers universities, certification bodies, and enterprises with real-time monitoring, anti-cheat AI, and a complete exam workflow.",
      },
      { property: "og:title", content: "Orcalis Assess — Secure AI Proctoring" },
      {
        property: "og:description",
        content:
          "Enterprise-grade online examination platform with real-time AI proctoring, analytics, and certification.",
      },
    ],
  }),
});

function HomePage() {
  return (
    <MarketingShell>
      <Hero />
      <LogoStrip />
      <FeatureGrid />
      <AudienceSplit />
      <Stats />
      <CTA />
    </MarketingShell>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ background: "var(--gradient-brand)" }}
    >
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[oklch(0.5_0.224_290)] opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-[oklch(0.55_0.2_262)] opacity-25 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Now with multi-modal AI proctoring
        </span>
        <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
          The Examination Platform Built for the{" "}
          <span className="bg-gradient-to-r from-white via-violet-200 to-sky-200 bg-clip-text text-transparent">
            AI Era
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
          Orcalis Assess gives institutions a single, secure system to author,
          schedule, deliver, and proctor online exams — with real-time AI
          behavioral monitoring, instant analytics, and verifiable digital
          certificates.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="rounded-xl bg-white px-6 text-[oklch(0.165_0.05_268)] hover:bg-white/90"
          >
            <Link to="/signup">
              Start free 14-day trial <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-xl border-white/20 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/contact">Book a demo</Link>
          </Button>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
          <Trust icon={ShieldCheck} text="SOC 2 Type II" />
          <Trust icon={Lock} text="ISO 27001" />
          <Trust icon={CheckCircle2} text="GDPR & FERPA ready" />
          <Trust icon={CheckCircle2} text="99.99% uptime SLA" />
        </div>
      </div>
    </section>
  );
}

function Trust({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-emerald-300" /> {text}
    </span>
  );
}

function LogoStrip() {
  return (
    <section className="border-b border-border bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Trusted by 500+ universities, boards &amp; enterprises
        </p>
        <div className="mt-6 grid grid-cols-2 items-center gap-6 opacity-70 sm:grid-cols-3 md:grid-cols-6">
          {["Stanford", "Cambridge", "Pearson", "Wiley", "Deloitte", "Coursera"].map(
            (n) => (
              <div
                key={n}
                className="text-center font-serif text-lg font-semibold tracking-tight text-foreground/70"
              >
                {n}
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: BrainCircuit,
    title: "AI behavioral proctoring",
    body: "Detect gaze drift, voices, additional faces, prohibited objects, and tab-switching in real time.",
  },
  {
    icon: Video,
    title: "Live monitor & intervention",
    body: "Proctors watch dozens of streams at once, flag incidents, and message candidates instantly.",
  },
  {
    icon: Layers,
    title: "Exam builder & question bank",
    body: "Sections, randomization, weighted scoring, multiple item types, and version control.",
  },
  {
    icon: BarChart3,
    title: "Analytics & psychometrics",
    body: "Score distributions, item analysis, cohort comparisons, and exportable audit reports.",
  },
  {
    icon: Award,
    title: "Verifiable certificates",
    body: "Auto-issue tamper-proof PDF certificates with public verification URLs and QR codes.",
  },
  {
    icon: Lock,
    title: "Enterprise-grade security",
    body: "Encryption in transit and at rest, SSO/SAML, role-based access, full audit logs.",
  },
];

function FeatureGrid() {
  return (
    <section className="bg-background py-24" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
            Platform
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">
            One platform. Every step of the exam lifecycle.
          </h2>
          <p className="mt-4 text-muted-foreground">
            From authoring a single question to running a 50,000-candidate
            high-stakes certification — Orcalis Assess scales with you.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md"
                style={{ background: "var(--gradient-primary)" }}
              >
                <f.icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceSplit() {
  return (
    <section className="bg-[oklch(0.985_0.005_260)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <AudienceCard
            icon={Building2}
            tag="For institutions"
            title="Admin & Proctor Console"
            points={[
              "Author exams, manage question banks, and schedule sittings",
              "Real-time live monitor across thousands of concurrent candidates",
              "Analytics, audit logs, billing & multi-campus org management",
              "SSO/SAML, role-based access, and white-label branding",
            ]}
            ctaLabel="Explore admin features"
            to="/features"
          />
          <AudienceCard
            icon={GraduationCap}
            tag="For students"
            title="Candidate Experience"
            points={[
              "Guided device & environment check-in with one click",
              "Distraction-free secure browser with auto-save",
              "Practice tests, instant results, and progress tracking",
              "Downloadable, verifiable certificates and transcripts",
            ]}
            ctaLabel="See the candidate flow"
            to="/features"
          />
        </div>
      </div>
    </section>
  );
}

function AudienceCard({
  icon: Icon,
  tag,
  title,
  points,
  ctaLabel,
  to,
}: {
  icon: typeof Building2;
  tag: string;
  title: string;
  points: string[];
  ctaLabel: string;
  to: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-background p-8 shadow-sm">
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
      <h3 className="mt-5 text-2xl font-bold tracking-tight">{title}</h3>
      <ul className="mt-6 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm text-foreground/85">
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-500" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <Button asChild variant="outline" className="mt-7 rounded-lg">
        <Link to={to}>
          {ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function Stats() {
  return (
    <section className="border-y border-border bg-background py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 text-center sm:grid-cols-4 sm:px-6 lg:px-8">
        {[
          { v: "500+", l: "Institutions" },
          { v: "12M+", l: "Exams delivered" },
          { v: "99.99%", l: "Uptime SLA" },
          { v: "<2%", l: "False-flag rate" },
        ].map((s) => (
          <div key={s.l}>
            <p className="text-4xl font-extrabold tracking-tight">{s.v}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="overflow-hidden rounded-3xl p-12 text-white shadow-xl md:p-16"
          style={{ background: "var(--gradient-brand)" }}
        >
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Ready to modernize your examinations?
              </h2>
              <p className="mt-3 max-w-xl text-slate-300">
                Spin up your institution in minutes. No credit card required.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button asChild size="lg" className="rounded-xl bg-white text-[oklch(0.165_0.05_268)] hover:bg-white/90">
                <Link to="/signup">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-white/20 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white">
                <Link to="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}