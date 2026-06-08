import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock, Search, Tag } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
  head: () => ({
    meta: [
      { title: "Blog & Resources — Orcalis Assess" },
      {
        name: "description",
        content:
          "Insights on AI proctoring, exam security, digital assessment best practices, and education technology.",
      },
    ],
  }),
});

const categories = ["All", "AI Proctoring", "Exam Design", "Security", "Analytics", "Institutions"];

const posts = [
  {
    title: "How AI Behavioral Analysis Reduces Exam Fraud by 94%",
    excerpt: "A deep dive into the multi-modal signals Orcalis Assess monitors — and how our false-flag rate stays below 2% even at scale.",
    category: "AI Proctoring",
    readTime: "8 min read",
    date: "May 14, 2025",
    featured: true,
    tag: "Featured",
  },
  {
    title: "The Complete Guide to Item Analysis for Modern Assessors",
    excerpt: "Understanding discrimination index, difficulty coefficients, and how psychometrics can improve your question bank over time.",
    category: "Exam Design",
    readTime: "12 min read",
    date: "May 8, 2025",
    featured: false,
    tag: "Guide",
  },
  {
    title: "SOC 2 Type II: What It Means for Your Institution's Exam Data",
    excerpt: "Breaking down the 89 trust service criteria that govern how Orcalis Assess stores, processes, and protects candidate data.",
    category: "Security",
    readTime: "6 min read",
    date: "Apr 28, 2025",
    featured: false,
    tag: "Security",
  },
  {
    title: "From 200 to 50,000 Candidates: Scaling Your Exam Infrastructure",
    excerpt: "How the University of Lagos used Orcalis Assess to transition their entire national entrance examination online in 60 days.",
    category: "Institutions",
    readTime: "9 min read",
    date: "Apr 20, 2025",
    featured: false,
    tag: "Case Study",
  },
  {
    title: "Adaptive Testing 101: Smarter Exams That Adjust to Each Candidate",
    excerpt: "Item response theory, CAT algorithms, and how adaptive assessments produce more accurate results with fewer questions.",
    category: "Exam Design",
    readTime: "10 min read",
    date: "Apr 11, 2025",
    featured: false,
    tag: "Guide",
  },
  {
    title: "Analytics That Matter: Moving Beyond Pass/Fail Reporting",
    excerpt: "How cohort analysis, item performance tracking, and learning outcome mapping give institutions actionable intelligence.",
    category: "Analytics",
    readTime: "7 min read",
    date: "Apr 3, 2025",
    featured: false,
    tag: "Insights",
  },
];

function BlogPage() {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const filtered = posts.filter((p) => {
    const catMatch = active === "All" || p.category === active;
    const qMatch = !query || p.title.toLowerCase().includes(query.toLowerCase());
    return catMatch && qMatch;
  });

  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <MarketingShell>
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-extrabold tracking-tight">Blog &amp; Resources</h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Insights on AI proctoring, exam security, and the future of digital assessments.
          </p>
        </div>
      </section>

      <section ref={ref} className="bg-background py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active === c
                      ? "bg-[oklch(0.5_0.224_290)] text-white"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 w-56 rounded-lg"
                placeholder="Search articles…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Featured */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="mb-10 overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
            >
              <div className="grid lg:grid-cols-[1.2fr_1fr]">
                <div
                  className="h-56 lg:h-auto"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <div className="flex h-full items-center justify-center opacity-20">
                    <BookOpen className="h-24 w-24 text-white" />
                  </div>
                </div>
                <div className="p-8">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                    <Tag className="h-3 w-3" /> {featured.tag}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight">{featured.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{featured.excerpt}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {featured.readTime}
                    <span>·</span>
                    <span>{featured.date}</span>
                  </div>
                  <Button asChild variant="outline" className="mt-5 rounded-lg">
                    <Link to="/blog">
                      Read article <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p, i) => (
              <motion.article
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div
                  className="mb-4 h-36 rounded-xl"
                  style={{ background: "var(--gradient-brand)", opacity: 0.85 }}
                />
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {p.category}
                </span>
                <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight group-hover:text-[oklch(0.5_0.224_290)] transition-colors">
                  {p.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">{p.excerpt}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {p.readTime}
                  <span>·</span> {p.date}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
