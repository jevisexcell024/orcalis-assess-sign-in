import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2, GraduationCap, ShieldCheck, BrainCircuit, Video,
  Layers, Library, CalendarClock, BarChart3, Award, CreditCard,
  Users, Lock, FileText, Globe, Sparkles, CheckCircle2, ArrowRight,
  Zap, Cpu, Eye, AlertTriangle, Fingerprint, Monitor,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/features")({
  component: FeaturesPage,
  head: () => ({
    meta: [
      { title: "Features — Orcalis Assess" },
      {
        name: "description",
        content:
          "Every Orcalis Assess feature — AI proctoring, live monitoring, exam builder, analytics, certificates, and enterprise security.",
      },
      { property: "og:title", content: "Orcalis Assess — Full feature list" },
    ],
  }),
});

const tabs = ["Platform", "Institutions", "Candidates"] as const;
type Tab = (typeof tabs)[number];

function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Platform");

  return (
    <MarketingShell>
      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium"
          >
            <Sparkles className="h-3.5 w-3.5" /> Full capability map
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 max-w-3xl text-5xl font-extrabold tracking-tight"
          >
            Every feature, for every role in the exam.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-2xl text-slate-300"
          >
            Platform infrastructure, institution tools, and the candidate
            experience — the complete Orcalis Assess capability stack.
          </motion.p>

          {/* Tab switcher */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex gap-2 flex-wrap"
          >
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "rounded-xl px-5 py-2 text-sm font-medium transition",
                  activeTab === t
                    ? "bg-white text-[oklch(0.165_0.05_268)] shadow-md"
                    : "border border-white/20 text-white/80 hover:bg-white/10",
                )}
              >
                {t}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tab content */}
      {activeTab === "Platform" && <PlatformTab />}
      {activeTab === "Institutions" && <InstitutionsTab />}
      {activeTab === "Candidates" && <CandidatesTab />}

      {/* CTA */}
      <FeaturesCTA />
    </MarketingShell>
  );
}

/* ── Platform tab ── */
const platformPillars = [
  {
    icon: ShieldCheck,
    title: "Security & Compliance Core",
    color: "from-violet-500 to-indigo-600",
    items: [
      "End-to-end encryption (TLS 1.3 + AES-256 at rest)",
      "SOC 2 Type II, ISO 27001, GDPR & FERPA aligned",
      "Row-level security across every tenant",
      "Full audit logs for every action, exportable",
    ],
  },
  {
    icon: BrainCircuit,
    title: "Proctoring AI Engine",
    color: "from-sky-500 to-cyan-500",
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
    color: "from-emerald-500 to-teal-500",
    items: [
      "Edge-deployed worldwide, <100ms median latency",
      "Auto-scales to 50,000 concurrent candidates",
      "99.99% uptime SLA on Enterprise",
      "Optional regional data residency (EU, US, APAC)",
    ],
  },
];

const aiFeatures = [
  { icon: Eye, title: "Gaze detection", desc: "Real-time eye-tracking flags candidates looking away from screen." },
  { icon: Cpu, title: "Behavioral scoring", desc: "Each candidate gets a live risk score updated every 30 seconds." },
  { icon: AlertTriangle, title: "Incident replay", desc: "Every flagged moment is time-stamped and replayable for review." },
  { icon: Fingerprint, title: "ID verification", desc: "Government-ID liveness check at check-in with 99.8% accuracy." },
  { icon: Monitor, title: "Screen recording", desc: "Optional full-screen recording with encrypted cloud storage." },
  { icon: Zap, title: "Zero-day model updates", desc: "AI models updated daily without downtime or candidate disruption." },
];

function PlatformTab() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <>
      <section ref={ref} className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
              Platform pillars
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight">
              What Orcalis Assess provides as the platform
            </h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {platformPillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-background p-6 shadow-sm transition hover:shadow-md"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${p.color}`}>
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI deep-dive */}
      <AIDeepDive />
    </>
  );
}

function AIDeepDive() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[oklch(0.985_0.005_260)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-12 grid items-end gap-4 lg:grid-cols-[1fr_auto]"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
              AI proctoring
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight">
              The intelligence behind every exam
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Six proprietary AI models work in concert to detect cheating
              with surgical precision — and minimal false positives.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-lg shrink-0">
            <Link to="/contact">Get a demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {aiFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: "var(--gradient-primary)" }}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Institutions tab ── */
const orgFeatures = [
  { icon: Layers, title: "Exam Builder", body: "Drag-and-drop sections, weighted scoring, randomized item pools, version history.", color: "from-violet-500 to-indigo-500" },
  { icon: Library, title: "Question Bank", body: "Versioned items, multi-format (MCQ, essay, code, file upload, audio).", color: "from-sky-500 to-cyan-500" },
  { icon: CalendarClock, title: "Scheduler", body: "Open / fixed / proctored windows, time zones, capacity caps, auto-reminders.", color: "from-emerald-500 to-teal-500" },
  { icon: Video, title: "Live Monitor", body: "Real-time proctor wall, flag & intervene without leaving the page.", color: "from-amber-500 to-orange-500" },
  { icon: BarChart3, title: "Analytics", body: "Score distributions, item analysis, cohort & longitudinal reports.", color: "from-pink-500 to-rose-500" },
  { icon: Award, title: "Certificates", body: "Auto-issued PDF certificates with QR verification and public URLs.", color: "from-indigo-500 to-violet-500" },
  { icon: Users, title: "Roles & Org", body: "Super Admin, Proctor, Reviewer, Candidate — multi-campus support.", color: "from-teal-500 to-emerald-500" },
  { icon: Lock, title: "SSO / SAML", body: "Google, Microsoft, Okta, custom SAML IdP, SCIM provisioning.", color: "from-slate-600 to-slate-800" },
  { icon: CreditCard, title: "Billing & Plans", body: "Self-serve subscriptions, invoices, seat / usage-based plans.", color: "from-cyan-500 to-sky-500" },
  { icon: FileText, title: "Audit Logs", body: "Immutable activity trail for compliance and dispute resolution.", color: "from-orange-500 to-amber-500" },
];

function InstitutionsTab() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex items-center gap-3 mb-12"
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">For institutions</p>
            <h2 className="text-3xl font-bold tracking-tight">Run a complete examination operation</h2>
          </div>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {orgFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group rounded-xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm ${f.color}`}>
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Candidates tab ── */
const studentFeatures = [
  { title: "One-click check-in", body: "Camera, mic, network & ID verification in under 60 seconds.", icon: Fingerprint },
  { title: "Secure exam runner", body: "Distraction-free interface with auto-save every 5 seconds.", icon: Lock },
  { title: "Practice library", body: "Unlimited mock tests in a non-proctored environment.", icon: Library },
  { title: "Instant results", body: "Auto-graded scores delivered the moment the exam closes.", icon: Zap },
  { title: "Certificates & wallet", body: "Download or share verifiable certificates anywhere.", icon: Award },
  { title: "Multilingual UI", body: "12 languages with full RTL support.", icon: Globe },
  { title: "Accessibility-first", body: "WCAG 2.2 AA, screen-reader optimized, extended time policies.", icon: Users },
  { title: "Payments & history", body: "Pay exam fees, view receipts, and replay past attempts.", icon: CreditCard },
];

function CandidatesTab() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[oklch(0.985_0.005_260)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex items-center gap-3 mb-12"
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">For students</p>
            <h2 className="text-3xl font-bold tracking-tight">A calm, fair, and accessible exam experience</h2>
          </div>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {studentFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm"
                style={{ background: "var(--gradient-primary)" }}
              >
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="border-t border-border bg-background py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to see it in action?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Start your free 14-day trial — no credit card required. Or book a
            personalized demo with our solutions team.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl text-white shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <Link to="/signup">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link to="/contact">Book a demo</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
