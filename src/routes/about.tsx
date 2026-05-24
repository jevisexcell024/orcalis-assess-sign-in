import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Sparkles, Target, Globe2, Users, ArrowRight, Heart, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    ],
  }),
});

const values = [
  {
    icon: Target,
    title: "Integrity first",
    body: "Every product decision is judged against one question: does this make cheating easier or harder? Integrity is not a feature — it's our foundation.",
  },
  {
    icon: Globe2,
    title: "Built for the world",
    body: "From small classrooms in Lagos to national boards in India — multi-language, multi-region, multi-currency. We serve institutions everywhere.",
  },
  {
    icon: Users,
    title: "Candidate-centric",
    body: "Accessibility, mental health, and fairness are baked into the candidate UX, not bolted on. We design for the student first.",
  },
  {
    icon: Zap,
    title: "Relentlessly fast",
    body: "Edge-deployed globally, auto-scaling infrastructure, and a team that ships weekly. Fast for institutions, fast for candidates.",
  },
  {
    icon: Heart,
    title: "Long-term trust",
    body: "We aim to be the most trusted name in digital assessment. That means SOC 2, ISO 27001, GDPR, FERPA — and treating compliance as a feature, not a checkbox.",
  },
  {
    icon: ShieldCheck,
    title: "Open accountability",
    body: "Uptime status pages, public audit summaries, transparent pricing. We'd rather lose a deal than mislead a customer.",
  },
];

const team = [
  { name: "Dr. Kwame Mensah", role: "Co-Founder & CEO", bg: "from-violet-400 to-indigo-500" },
  { name: "Aria Zhang", role: "Co-Founder & CTO", bg: "from-sky-400 to-cyan-500" },
  { name: "Samuel Adeyemi", role: "Chief Product Officer", bg: "from-emerald-400 to-teal-500" },
  { name: "Priya Nair", role: "VP of Engineering", bg: "from-pink-400 to-rose-500" },
  { name: "Thomas Müller", role: "VP of Sales", bg: "from-amber-400 to-orange-500" },
  { name: "Mei Lin Tan", role: "Head of Security", bg: "from-slate-500 to-slate-700" },
];

function AboutPage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium"
          >
            <Sparkles className="h-3.5 w-3.5" /> Our mission
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-5xl font-extrabold leading-tight tracking-tight"
          >
            Examinations the world can trust.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-slate-300"
          >
            Orcalis Assess exists to make high-stakes online testing as
            credible, secure, and accessible as the best in-person testing
            centers — without the cost, friction, or geographical limits.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <StatsSection />

      {/* Values */}
      <ValuesSection />

      {/* Story */}
      <StorySection />

      {/* Team */}
      <TeamSection />

      {/* CTA */}
      <section className="bg-[oklch(0.985_0.005_260)] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">Join us on the mission</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            We're always looking for people who care deeply about education integrity,
            academic fairness, and building technology with purpose.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl text-white" style={{ background: "var(--gradient-primary)" }}>
              <Link to="/contact">View open roles <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="border-b border-border bg-background py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 text-center sm:grid-cols-4 sm:px-6 lg:px-8">
        {[
          { v: "2023", l: "Founded" },
          { v: "60+", l: "Countries served" },
          { v: "12M+", l: "Exams delivered" },
          { v: "120", l: "Team members" },
        ].map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <p className="text-4xl font-extrabold tracking-tight text-[oklch(0.296_0.124_281)]">{s.v}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ValuesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[oklch(0.985_0.005_260)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
            Our values
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">How we build & operate</h2>
        </motion.div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-background p-6 shadow-sm"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StorySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="border-y border-border bg-background py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
            Our story
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">Born from a broken exam</h2>
          <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              In 2022, our co-founder Dr. Kwame Mensah was overseeing national
              university entrance exams in West Africa. That cycle, 11% of
              candidates were found to have received exam questions in advance.
              The entire sitting had to be rerun — costing the national board
              $4.2M and delaying admission for 80,000 students by four months.
            </p>
            <p>
              Kwame spent the next 18 months building what the market couldn't
              offer: a platform that was simultaneously accessible enough for
              a 400-student college and secure enough for a 500,000-candidate
              national exam. Orcalis Assess launched in early 2023.
            </p>
            <p>
              Today we operate in 60+ countries, power exams for some of the
              world's most trusted certification bodies, and remain obsessively
              focused on one thing: making every examination worth sitting for.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TeamSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[oklch(0.985_0.005_260)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.224_290)]">
            Leadership
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight">The team</h2>
        </motion.div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-background p-5 flex items-center gap-4"
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${m.bg} shrink-0`} />
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
