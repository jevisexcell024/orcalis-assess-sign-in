import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowRight, Home } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/not-found")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center text-white"
      style={{ background: "var(--gradient-brand)" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg px-4 text-center"
      >
        <Link to="/home" className="inline-flex items-center gap-2.5 mb-10">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Orcalis Assess</span>
        </Link>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-8xl font-black tracking-tighter text-white/20"
        >
          404
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="-mt-4 text-3xl font-bold tracking-tight"
        >
          Page not found
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-slate-300"
        >
          This page has either moved or doesn't exist. Let's get you back to your exam platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <Button asChild size="lg" className="rounded-xl bg-white text-[oklch(0.165_0.05_268)] hover:bg-white/90">
            <Link to="/home">
              <Home className="mr-2 h-4 w-4" /> Go home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-xl border-white/20 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white">
            <Link to="/contact">
              Contact support <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
