import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BarChart3,
  Award,
  CreditCard,
  Heart,
  Layers,
  LayoutDashboard,
  Library,
  LogOut,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  CalendarClock,
  Video,
  FileText,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";
import type { ReactNode } from "react";

type NavLink = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

const mainNav: NavLink[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
];

const examNav: NavLink[] = [
  { label: "Exams", to: "/admin/exams", icon: Layers },
  { label: "Question Bank", to: "/admin/question-bank", icon: Library },
  { label: "Scheduler", to: "/admin/scheduler", icon: CalendarClock },
];

const platformNav: NavLink[] = [
  { label: "Live Monitor", to: "/admin/live-monitor", icon: Video, badge: "Live" },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "Certificates", to: "/admin/certificates", icon: Award },
  { label: "Candidates", to: "/admin/candidates", icon: UsersRound },
  { label: "Results", to: "/admin/results", icon: FileText },
  { label: "Attendance", to: "/admin/attendance", icon: CalendarClock },
  { label: "Students (SIS)", to: "/admin/students", icon: UsersRound },
  { label: "Communication", to: "/admin/communication", icon: Bell },
  { label: "Integrity", to: "/admin/academic-integrity", icon: ShieldCheck },
  { label: "Reports", to: "/admin/reports", icon: FileText },
];

const monitoringNav: NavLink[] = [
  { label: "AI Violations", to: "/admin/violations", icon: ShieldAlert, badge: "Live" },
  { label: "System Health", to: "/admin", icon: Heart },
];

const adminNav: NavLink[] = [
  { label: "Organization", to: "/admin/organization", icon: Building2 },
  { label: "Team", to: "/admin/team", icon: UsersRound },
  { label: "Billing & Plans", to: "/admin/billing", icon: CreditCard },
  { label: "Audit Logs", to: "/admin/audit-logs", icon: FileText },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export function AdminShell({
  title,
  breadcrumbs,
  actions,
  children,
}: {
  title: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-[oklch(0.985_0.005_260)]">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Orcalis Assess</span>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-2">
          <NavSection items={mainNav} pathname={pathname} />
          <NavSection label="Examination" items={examNav} pathname={pathname} />
          <NavSection label="Platform" items={platformNav} pathname={pathname} />
          <NavSection label="Monitoring" items={monitoringNav} pathname={pathname} />
          <NavSection label="Administration" items={adminNav} pathname={pathname} />
        </nav>

        <div className="m-3 rounded-xl bg-[oklch(0.18_0.04_265)] p-3 text-white">
          <p className="text-xs font-semibold">System Status</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            All systems operational
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {b.to ? (
                      <Link to={b.to} className="hover:text-foreground">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="text-foreground">{b.label}</span>
                    )}
                    {i < breadcrumbs.length - 1 && <span>/</span>}
                  </span>
                ))}
              </nav>
            ) : null}
            <h2 className="truncate text-[15px] font-semibold tracking-tight">{title}</h2>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="h-9 w-64 rounded-lg border-input bg-muted/40 pl-9 text-sm"
              />
            </div>
            <button aria-label="Notifications" className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
            </button>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              aria-label="Sign out"
              title="Sign out"
              className="flex items-center gap-2.5 rounded-lg border border-border bg-background py-1 pl-1 pr-3 transition hover:bg-muted"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-sky-400 to-indigo-500 text-[11px] font-semibold text-white">
                AC
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight">Alex Carter</p>
                <p className="text-[11px] text-muted-foreground">Super Admin</p>
              </div>
              <LogOut className="ml-1 hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>
          </div>
        </header>

        {actions ? (
          <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2 sm:px-6 lg:px-8">
            {actions}
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function NavSection({
  label,
  items,
  pathname,
}: {
  label?: string;
  items: NavLink[];
  pathname: string;
}) {
  return (
    <div>
      {label ? (
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
          {label}
        </p>
      ) : null}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active =
            item.to === "/admin"
              ? pathname === "/admin"
              : pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "font-semibold text-white shadow-sm"
                    : "text-foreground/75 hover:bg-muted hover:text-foreground",
                )}
                style={active ? { background: "var(--gradient-primary)" } : undefined}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                      active
                        ? "bg-white/20 text-white ring-white/30"
                        : "bg-rose-50 text-rose-600 ring-rose-200",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}