import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck, Eye, BrainCircuit, Video, Award, BarChart3,
  Building2, GraduationCap, Layers, Lock, ArrowRight,
  CheckCircle2, Sparkles, Play, TrendingUp, Users, Globe2,
  Zap, Star,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <DashboardPreview />
      <AudienceSplit />
      <Stats />
      <Testimonials />
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
      {/* Animated blobs */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.4, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[oklch(0.5_0.224_290)] blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-[oklch(0.55_0.2_262)] blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.15, 0.22, 0.15] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="pointer-events-none absolute left-1/2 top-1/4 h-64 w-64 rounded-full bg-violet-400 blur-3xl"
      />
      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/90 backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-300" /> Now with multi-modal AI proctoring
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-[64px]"
            >
              Redefining Digital{" "}
              <span className="bg-gradient-to-r from-white via-violet-200 to-sky-200 bg-clip-text text-transparent">
                Assessments
              </span>{" "}
              for the Modern Institution
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300"
            >
              AI-powered online examinations, secure proctoring, real-time analytics,
              and institution-scale assessment infrastructure — all in one platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-white px-6 text-[oklch(0.165_0.05_268)] shadow-lg hover:bg-white/90"
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
                <Link to="/contact">
                  <Play className="mr-2 h-4 w-4 fill-current" /> Watch demo
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300"
            >
              <Trust icon={ShieldCheck} text="SOC 2 Type II" />
              <Trust icon={Lock} text="ISO 27001" />
              <Trust icon={CheckCircle2} text="GDPR & FERPA" />
              <Trust icon={CheckCircle2} text="99.99% uptime SLA" />
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <HeroDashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroDashboardMockup() {
  return (
    <div className="relative">
      {/* Main card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm shadow-2xl">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
            app.orcalis-assess.com/dashboard
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Live Candidates", val: "1,247", color: "text-emerald-300", up: true },
            { label: "Flagged Events", val: "3", color: "text-amber-300", up: false },
            { label: "Completed", val: "98.4%", color: "text-sky-300", up: true },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-white/[0.05] p-3">
              <p className="text-[9px] text-white/50 uppercase tracking-wide">{m.label}</p>
              <p className={`mt-1 text-lg font-bold ${m.color}`}>{m.val}</p>
            </div>
          ))}
        </div>

        {/* Candidate stream */}
        <div className="rounded-xl bg-white/[0.05] p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/60">
            Live Monitor — 6 streams
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { status: "ok", name: "Ada M.", time: "01:23:45" },
              { status: "flag", name: "James K.", time: "01:23:12" },
              { status: "ok", name: "Priya S.", time: "01:22:58" },
              { status: "ok", name: "Chen W.", time: "01:23:31" },
              { status: "ok", name: "Omar A.", time: "01:22:09" },
              { status: "pause", name: "Lisa B.", time: "01:21:44" },
            ].map((c) => (
              <div key={c.name} className="rounded-lg bg-white/[0.06] p-2">
                <div
                  className={cn(
                    "mb-1.5 h-10 w-full rounded bg-gradient-to-br",
                    c.status === "ok" && "from-slate-600 to-slate-700",
                    c.status === "flag" && "from-amber-700/50 to-amber-900/50",
                    c.status === "pause" && "from-slate-700 to-slate-800",
                  )}
                />
                <p className="text-[9px] font-medium text-white/80">{c.name}</p>
                <p className="text-[8px] text-white/40">{c.time}</p>
                {c.status === "flag" && (
                  <span className="mt-0.5 inline-block rounded-full bg-amber-500/20 px-1 py-0.5 text-[7px] font-semibold text-amber-300">
                    FLAG
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-6 top-12 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 backdrop-blur-sm shadow-lg"
      >
        <p className="text-[10px] text-white/60">AI Confidence</p>
        <p className="text-sm font-bold text-emerald-300">99.7%</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -right-4 bottom-16 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 backdrop-blur-sm shadow-lg"
      >
        <p className="text-[10px] text-white/60">Incidents blocked</p>
        <p className="text-sm font-bold text-violet-300">14 today</p>
      </motion.div>
    </div>
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
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="border-b border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        >
          Trusted by 500+ universities, boards &amp; enterprises
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 0.65, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-7 grid grid-cols-3 items-center gap-6 sm:grid-cols-6"
        >
          {["Stanford", "Cambridge", "Pearson", "Wiley", "Deloitte", "Coursera"].map((n) => (
            <div
              key={n}
              className="text-center font-serif text-lg font-semibold tracking-tight text-foreground/70"
            >
              {n}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: BrainCircuit,
    title: "AI behavioral proctoring",
    body: "Detect gaze drift, voices, additional faces, prohibited objects, and tab-switching in real time.",
    tag: "Core AI",
    color: "from-violet-500 to-indigo-500",
  },
  {
    icon: Video,
    title: "Live monitor & intervention",
    body: "Proctors watch dozens of streams at once, flag incidents, and message candidates instantly.",
    tag: "Real-time",
    color: "from-sky-500 to-cyan-500",
  },
  {
    icon: Layers,
    title: "Exam builder & question bank",
    body: "Sections, randomization, weighted scoring, multiple item types, and version control.",
    tag: "Authoring",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Analytics & psychometrics",
    body: "Score distributions, item analysis, cohort comparisons, and exportable audit reports.",
    tag: "Insights",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Award,
    title: "Verifiable certificates",
    body: "Auto-issue tamper-proof PDF certificates with public verification URLs and QR codes.",
    tag: "Credentials",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Lock,
    title: "Enterprise-grade security",
    body: "Encryption in transit and at rest, SSO/SAML, role-based access, full audit logs.",
    tag: "Security",
    color: "from-slate-600 to-slate-800",
  },
];

function FeatureGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-background py-28" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
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
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "radial-gradient(circle at 50% 0%, oklch(0.5 0.224 290 / 0.04), transparent 70%)" }}
              />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${f.color}`}
                  >
                    <f.icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {f.tag}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <Link
                  to="/features"
                  className="mt-4 flex items-center gap-1 text-xs font-medium text-[oklch(0.5_0.224_290)] opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Learn more <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/features">
              View all features <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="overflow-hidden bg-[oklch(0.985_0.005_260)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
            Platform experience
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">
            A command center for every exam
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Beautifully designed. Ruthlessly functional. Built for institutions that
            take academic integrity seriously.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-12 overflow-hidden rounded-2xl border border-border bg-[oklch(0.165_0.05_268)] shadow-2xl"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
              <div className="h-3 w-3 rounded-full bg-green-400/60" />
            </div>
            <div className="mx-auto flex items-center gap-2 rounded-md bg-white/[0.06] px-3 py-1 text-[11px] text-white/40">
              <Lock className="h-2.5 w-2.5" />
              app.orcalis-assess.com/dashboard
            </div>
          </div>

          {/* Dashboard layout */}
          <div className="grid grid-cols-4 gap-0 min-h-[340px]">
            {/* Sidebar */}
            <div className="border-r border-white/10 p-4 col-span-1">
              <div className="space-y-1">
                {["Dashboard", "Exams", "Candidates", "Analytics", "Certificates", "Settings"].map(
                  (item, i) => (
                    <div
                      key={item}
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${
                        i === 0
                          ? "bg-white/[0.08] text-white"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Main content */}
            <div className="col-span-3 p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Active Exams", val: "12", icon: Layers, color: "text-violet-300" },
                  { label: "Candidates Today", val: "3,841", icon: Users, color: "text-sky-300" },
                  { label: "Pass Rate", val: "87.4%", icon: TrendingUp, color: "text-emerald-300" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-white/[0.05] p-4">
                    <m.icon className={`h-4 w-4 ${m.color} mb-2`} />
                    <p className="text-[10px] text-white/50">{m.label}</p>
                    <p className={`mt-0.5 text-xl font-bold ${m.color}`}>{m.val}</p>
                  </div>
                ))}
              </div>

              {/* Activity list */}
              <div className="rounded-xl bg-white/[0.04] p-3">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Recent Activity
                </p>
                {[
                  { text: "WAEC Mock Exam started", time: "2 min ago", dot: "bg-emerald-400" },
                  { text: "Incident flagged: Candidate #1827", time: "5 min ago", dot: "bg-amber-400" },
                  { text: "189 certificates auto-issued", time: "12 min ago", dot: "bg-sky-400" },
                  { text: "Analytics report exported", time: "34 min ago", dot: "bg-violet-400" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className={`h-1.5 w-1.5 rounded-full ${a.dot} shrink-0`} />
                    <p className="flex-1 text-[11px] text-white/70">{a.text}</p>
                    <p className="text-[10px] text-white/30">{a.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AudienceSplit() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-2xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
            Who it's for
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">
            Designed for every role in the exam
          </h2>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {[
            {
              icon: Building2,
              tag: "For institutions",
              title: "Admin & Proctor Console",
              points: [
                "Author exams, manage question banks, and schedule sittings",
                "Real-time live monitor across thousands of concurrent candidates",
                "Analytics, audit logs, billing & multi-campus org management",
                "SSO/SAML, role-based access, and white-label branding",
              ],
              ctaLabel: "Explore admin features",
              delay: 0,
            },
            {
              icon: GraduationCap,
              tag: "For students",
              title: "Candidate Experience",
              points: [
                "Guided device & environment check-in with one click",
                "Distraction-free secure browser with auto-save",
                "Practice tests, instant results, and progress tracking",
                "Downloadable, verifiable certificates and transcripts",
              ],
              ctaLabel: "See the candidate flow",
              delay: 0.12,
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: card.delay }}
              className="rounded-3xl border border-border bg-background p-8 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {card.tag}
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-tight">{card.title}</h3>
              <ul className="mt-6 space-y-3">
                {card.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-foreground/85">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-7 rounded-lg">
                <Link to="/features">
                  {card.ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function useCountUp(target: number, inView: boolean, duration = 1.5) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return count;
}

function Stats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const stats = [
    { raw: 500, suffix: "+", label: "Institutions" },
    { raw: 12, suffix: "M+", label: "Exams delivered" },
    { raw: 9999, suffix: "%", label: "Uptime SLA", display: "99.99" },
    { raw: 2, suffix: "%", label: "False-flag rate", display: "<2" },
  ];

  return (
    <section ref={ref} className="border-y border-border bg-[oklch(0.985_0.005_260)] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 text-center sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <p className="text-4xl font-extrabold tracking-tight text-[oklch(0.296_0.124_281)]">
                {s.display ?? <CountUpDisplay target={s.raw} inView={inView} />}
                {s.suffix}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CountUpDisplay({ target, inView }: { target: number; inView: boolean }) {
  const count = useCountUp(target, inView);
  return <>{count}</>;
}

const testimonials = [
  {
    quote: "Orcalis Assess transformed how we run our national certification exams. Zero incidents in our last cycle.",
    name: "Dr. Amara Osei",
    role: "Director of Assessments, Ghana Education Service",
    rating: 5,
  },
  {
    quote: "The AI proctoring accuracy is remarkable. Our false-flag rate dropped from 8% to under 2% after switching.",
    name: "Prof. Elena Marchetti",
    role: "IT Director, University of Bologna",
    rating: 5,
  },
  {
    quote: "Setup took 45 minutes. We ran our first 3,000-candidate exam a week later. Remarkable product.",
    name: "James Whitfield",
    role: "Head of L&D, Deloitte UK",
    rating: 5,
  },
];

function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
            Testimonials
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">
            Loved by institutions worldwide
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-background p-6 shadow-sm"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground/85">"{t.quote}"</p>
              <div className="mt-5">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="bg-[oklch(0.985_0.005_260)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-3xl p-12 text-white shadow-2xl md:p-16"
          style={{ background: "var(--gradient-brand)" }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe2 className="h-5 w-5 text-violet-300" />
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                  Join 500+ institutions
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Ready to modernize your examinations?
              </h2>
              <p className="mt-3 max-w-xl text-slate-300">
                Spin up your institution in minutes. No credit card required.
                Cancel anytime.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-white text-[oklch(0.165_0.05_268)] shadow-lg hover:bg-white/90"
              >
                <Link to="/signup">
                  Start free trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-white/20 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
