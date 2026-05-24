import { Link } from "@tanstack/react-router";
import { ShieldCheck, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

export function MarketingShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/home" className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
              style={{ background: "var(--gradient-primary)" }}
            >
              <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Orcalis Assess</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "text-foreground bg-muted" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="rounded-md px-3 py-1.5 text-sm font-medium transition hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Link
              to="/"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Sign in
            </Link>
            <Button
              asChild
              className="rounded-lg text-white shadow-md"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Link to="/signup">Start free trial</Link>
            </Button>
          </div>
          <button
            className="ml-auto rounded-md p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {open && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2">
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
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-border bg-[oklch(0.985_0.005_260)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
                style={{ background: "var(--gradient-primary)" }}
              >
                <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
              </div>
              <span className="text-[15px] font-semibold tracking-tight">Orcalis Assess</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Secure, AI-powered online examination &amp; remote proctoring for
              universities, certification bodies, and enterprises worldwide.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { label: "Features", to: "/features" },
              { label: "Pricing", to: "/pricing" },
              { label: "Security", to: "/features" },
              { label: "Integrations", to: "/features" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About", to: "/about" },
              { label: "Contact", to: "/contact" },
              { label: "Customers", to: "/about" },
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
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} Orcalis Assess. All rights reserved.</p>
            <p>SOC 2 Type II · ISO 27001 · GDPR · FERPA compliant</p>
          </div>
        </div>
      </footer>
    </div>
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
              className={cn(
                "text-sm text-muted-foreground transition hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}