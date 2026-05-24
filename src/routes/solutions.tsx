import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2, GraduationCap, Briefcase, Globe2, Award, Users,
  ArrowRight, CheckCircle2, Sparkles, BarChart3, ShieldCheck,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/solutions")({
  component: SolutionsPage,
  head: () => ({
    meta: [
      { title: "Solutions — Orcalis Assess" },
      {
        name: "description",
        content:
          "Tailored online examination solutions for universities, certification bodies, enterprises, and government boards.",
      },
    ],
  }),
});

const solutions = [
  {
    icon: Building2,
    segment: "Universities & Colleges",
    headline: "Scale exams to 50,000+ concurrent candidates",
    body: "From mid-terms to finals, dissertations to entrance exams — Orcalis Assess gives university administrators a complete exam lifecycle platform with AI proctoring, multi-department org management, and analytics.",
    challenges: ["Manual invigilation costs", "Plagiarism & cheating", "Results bottlenecks", "Paper-based inefficiency"],
    benefits: ["Reduce exam admin cost by up to 60%", "AI proctoring with <2% false-flag rate", "Auto-grading and instant result release", "Multi-campus org with role-based access"],
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: Award,
    segment: "Certification Bodies",
    headline: "Issue verifiable, tamper-proof digital credentials",
    body: "Certification authorities trust Orcalis Assess to deliver high-stakes exams with cryptographically verified certificates, custom branding, and a full candidate audit trail.",
    challenges: ["Certificate fraud", "Scaling test delivery", "Candidate identity verification", "Audit compliance"],
    benefits: ["QR-code verifiable certificates", "ID verification at check-in", "Full SOC 2 & ISO 27001 compliance", "Custom branding & white-label"],
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Briefcase,
    segment: "Enterprises & Recruitment",
    headline: "Hire smarter with skills-based testing",
    body: "From pre-hire assessments to annual compliance training, Orcalis Assess integrates with your ATS and LMS to deliver fair, bias-resistant, AI-monitored evaluations at scale.",
    challenges: ["Resume fraud & skills gap", "Cheating in remote hiring", "ATS/LMS fragmentation", "Compliance documentation"],
    benefits: ["ATS & Slack integrations", "Anti-cheating for remote screening", "Exportable compliance records", "Custom question banks per role"],
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Globe2,
    segment: "Government & Public Boards",
    headline: "Nation-scale exam delivery with military-grade security",
    body: "Public service boards and national examination authorities rely on Orcalis Assess for mission-critical exams, air-gapped deployment options, and real-time command centers.",
    challenges: ["Exam paper leaks", "Logistical coordination", "Fairness & accessibility", "Regulatory compliance"],
    benefits: ["Air-gapped & on-premise options", "Real-time incident command", "Multi-language, multi-region support", "Dedicated infra & data residency"],
    color: "from-sky-500 to-cyan-500",
  },
  {
    icon: GraduationCap,
    segment: "Training Providers",
    headline: "Deliver professional training with integrated assessments",
    body: "Online academies and professional training providers use Orcalis Assess to close the loop between learning and assessment — with SCORM support, LMS integration, and outcome analytics.",
    challenges: ["Manual test grading", "Lack of learning analytics", "No certificate workflow", "LMS fragmentation"],
    benefits: ["SCORM & LMS integration", "Outcome-linked analytics", "Auto-issue branded certificates", "Practice test library"],
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Users,
    segment: "Corporate L&D",
    headline: "Measure learning impact across your entire workforce",
    body: "L&D teams at global enterprises use Orcalis Assess to run compliance, onboarding, and upskilling assessments — with full audit trails, manager dashboards, and HRIS integration.",
    challenges: ["No assessment-learning link", "Compliance proof requirements", "Global workforce scale", "Manager visibility"],
    benefits: ["HRIS & SSO integration", "Compliance audit exports", "Manager & cohort dashboards", "Supports 100+ languages"],
    color: "from-violet-500 to-purple-500",
  },
];

function SolutionsPage() {
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
            <Sparkles className="h-3.5 w-3.5" /> Built for every institution type
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-3xl text-5xl font-extrabold tracking-tight"
          >
            Solutions tailored to your institution
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-2xl text-slate-300"
          >
            Whether you're a university running finals or a government board
            delivering national exams — Orcalis Assess has a solution configured
            for your exact needs.
          </motion.p>
        </div>
      </section>

      {/* Solutions */}
      {solutions.map((s, i) => (
        <SolutionSection key={s.segment} solution={s} flip={i % 2 === 1} />
      ))}

      {/* CTA */}
      <section className="bg-[oklch(0.985_0.005_260)] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <ShieldCheck className="mx-auto h-10 w-10 text-[oklch(0.5_0.224_290)]" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight">
            Not sure which plan fits?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Talk to our solutions team. We'll map your institution's workflow to
            the right Orcalis Assess configuration.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl text-white" style={{ background: "var(--gradient-primary)" }}>
              <Link to="/contact">Book a demo</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link to="/pricing">See pricing <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

function SolutionSection({
  solution: s,
  flip,
}: {
  solution: (typeof solutions)[0];
  flip: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className={`py-20 ${flip ? "bg-[oklch(0.985_0.005_260)]" : "bg-background"} border-b border-border`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`grid items-start gap-12 lg:grid-cols-2 ${flip ? "lg:flex-row-reverse" : ""}`}>
          <motion.div
            initial={{ opacity: 0, x: flip ? 20 : -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className={flip ? "lg:order-2" : ""}
          >
            <div className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${s.color} p-2.5 text-white mb-4`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
              {s.segment}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">{s.headline}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{s.body}</p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              {s.benefits.map((b) => (
                <div key={b} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <Button asChild variant="outline" className="mt-7 rounded-lg">
              <Link to="/contact">
                Talk to solutions team <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: flip ? -20 : 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={flip ? "lg:order-1" : ""}
          >
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Challenges solved
                </p>
              </div>
              <div className="space-y-3">
                {s.challenges.map((c, i) => (
                  <div key={c} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium">{c}</p>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/50" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
