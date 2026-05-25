import { Link, useLocation } from "@tanstack/react-router";
import { ShieldCheck, Menu, X, ChevronDown, Sparkles } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Features", to: "/features" },
  {
    label: "Solutions",
    to: "/solutions",
    children: [
      { label: "Universities", desc: "Scale to 50,000+ concurrent candidates" },
      { label: "Certification Bodies", desc: "Verifiable digital credentials" },
      { label: "Enterprises", desc: "Recruitment & compliance testing" },
      { label: "Government", desc: "Nation-wide high-stakes exams" },
    ],
  },
  { label: "Pricing", to: "/pricing" },
  { label: "Resources", to: "/blog" },
  { label: "About", to: "/about" },
] as const;

export function MarketingShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setOpen(false);
    setDropdown(null);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Announcement bar */}
      <div
        className="flex items-center justify-center gap-2 py-2 text-[11px] font-medium text-white"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Sparkles className="h-3 w-3" />
        <span>Multi-modal AI proctoring is now live —</span>
        <Link to="/features" className="underline underline-offset-2 opacity-90 hover:opacity-100">
          See what's new
        </Link>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/90 shadow-sm backdrop-blur-xl"
            : "bg-background/80 backdrop-blur-sm",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
              style={{ background: "var(--gradient-primary)" }}
            >
              <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              Orcalis <span className="text-[oklch(0.5_0.224_290)]">Assess</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-4 hidden items-center gap-0.5 md:flex">
            {nav.map((item) => {
              const hasChildren = "children" in item;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => hasChildren && setDropdown(item.label)}
                  onMouseLeave={() => setDropdown(null)}
                >
                  {hasChildren ? (
                    <button
                      className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          dropdown === item.label && "rotate-180",
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      to={item.to}
                      activeProps={{ className: "text-foreground bg-muted" }}
                      inactiveProps={{ className: "text-muted-foreground" }}
                      className="rounded-md px-3 py-1.5 text-sm font-medium transition hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  )}

                  <AnimatePresence>
                    {hasChildren && dropdown === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1.5 w-60 rounded-xl border border-border bg-background p-1.5 shadow-xl"
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            to={item.to}
                            className="block rounded-lg px-3 py-2.5 hover:bg-muted"
                          >
                            <p className="text-sm font-medium">{child.label}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{child.desc}</p>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Link
              to="/"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Sign in
            </Link>
            <Button
              asChild
              size="sm"
              className="rounded-lg text-white shadow-md"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Link to="/signup">Start free trial</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="ml-auto rounded-md p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border bg-background md:hidden"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
                {nav.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/">Sign in</Link>
                  </Button>
                  <Button
                    asChild
                    className="flex-1 text-white"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Link to="/signup">Start free trial</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>{children}</main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-[oklch(0.985_0.005_260)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
                style={{ background: "var(--gradient-primary)" }}
              >
                <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
              </div>
              <span className="text-[15px] font-semibold tracking-tight">
                Orcalis <span className="text-[oklch(0.5_0.224_290)]">Assess</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Secure, AI-powered online examination & remote proctoring for
              universities, certification bodies, and enterprises worldwide.
            </p>
            <div className="mt-5 flex gap-3">
              {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-[oklch(0.5_0.224_290)] hover:text-foreground"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title="Product"
            links={[
              { label: "Features", to: "/features" },
              { label: "Solutions", to: "/solutions" },
              { label: "Pricing", to: "/pricing" },
              { label: "Security", to: "/features" },
              { label: "Integrations", to: "/features" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About", to: "/about" },
              { label: "Blog", to: "/blog" },
              { label: "Contact", to: "/contact" },
              { label: "Careers", to: "/about" },
            ]}
          />
          <FooterCol
            title="Get started"
            links={[
              { label: "Sign in", to: "/" },
              { label: "Create account", to: "/signup" },
              { label: "Admin portal", to: "/admin-login" },
              { label: "Book a demo", to: "/contact" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Orcalis Assess. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <span>SOC 2 Type II · ISO 27001 · GDPR · FERPA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className={cn("text-sm text-muted-foreground transition hover:text-foreground")}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
