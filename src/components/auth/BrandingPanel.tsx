import { motion } from "motion/react";
import { ShieldCheck, Check, Eye, Lock } from "lucide-react";

const features = [
  {
    icon: Check,
    label: "Real-time AI behavioral analysis",
    tone: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  },
  {
    icon: Eye,
    label: "Multi-camera environmental monitoring",
    tone: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  },
  {
    icon: Lock,
    label: "Military-grade data encryption",
    tone: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  },
];

export function BrandingPanel() {
  return (
    <aside
      className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
      style={{ background: "var(--gradient-brand)" }}
    >
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[oklch(0.5_0.224_290)] opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-[oklch(0.55_0.2_262)] opacity-25 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center gap-3"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          Orcalis Assess
        </span>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 max-w-xl">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white xl:text-[64px]"
        >
          Secure, Intelligent
          <br />
          Examination
          <br />
          <span className="bg-gradient-to-r from-white via-violet-200 to-sky-200 bg-clip-text text-transparent">
            Ecosystem.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-lg text-base leading-relaxed text-slate-300"
        >
          Enterprise-grade online examination and AI-powered proctoring for
          institutions of every scale. Create secure exams, monitor candidates in
          real time, and analyze results with unparalleled precision and trust.
        </motion.p>

        <div className="mt-10 space-y-3">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
              className="flex h-[72px] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 backdrop-blur-md"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ring-1 ${f.tone}`}
              >
                <f.icon className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="text-sm font-medium text-white">{f.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="relative z-10 flex items-center gap-3"
      >
        <div className="flex -space-x-2">
          {[
            "from-rose-400 to-orange-400",
            "from-sky-400 to-indigo-500",
            "from-emerald-400 to-teal-500",
          ].map((g, i) => (
            <div
              key={i}
              className={`h-9 w-9 rounded-full bg-gradient-to-br ${g} ring-2 ring-[oklch(0.165_0.05_268)]`}
            />
          ))}
        </div>
        <p className="text-sm text-slate-300">
          Trusted by{" "}
          <span className="font-semibold text-white">500+ institutions</span>{" "}
          globally
        </p>
      </motion.div>
    </aside>
  );
}