import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Award,
  BarChart2,
  Bell,
  CalendarDays,
  CreditCard,
  Home,
  LogOut,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  User,
  Menu,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";

const nav: { label: string; to: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Dashboard",     to: "/student",               icon: Home        },
  { label: "My Exams",      to: "/student/exams",         icon: NotebookPen },
  { label: "My Results",    to: "/student/results",       icon: BarChart2   },
  { label: "Attendance",    to: "/student/attendance",    icon: CalendarDays},
  { label: "Certificates",  to: "/student/certificates",  icon: Award       },
  { label: "Announcements", to: "/student/announcements", icon: Bell        },
  { label: "Payments",      to: "/student/payments",      icon: CreditCard  },
  { label: "Profile",       to: "/student/profile",       icon: User        },
  { label: "Practice Tests",to: "/student/practice",      icon: Sparkles    },
];

const NAVY = "oklch(0.385 0.12 247)";

export function StudentShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { displayName, initials } = useCurrentUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/student"
      ? pathname === "/student"
      : pathname === to || pathname.startsWith(to + "/");

  const SidebarContent = () => (
    <>
      <div className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-[oklch(0.92_0.01_252)] px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white" style={{ backgroundColor: NAVY }}>
          <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-none tracking-tight text-[oklch(0.12_0.03_260)]">Orcalis</p>
          <p className="text-[10px] leading-none text-[oklch(0.50_0.04_252)] mt-0.5 tracking-widest uppercase">Assess</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {nav.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all",
                active
                  ? "text-white"
                  : "text-[oklch(0.40_0.04_255)] hover:bg-[oklch(0.95_0.008_252)] hover:text-[oklch(0.15_0.04_260)]",
              )}
              style={active ? { backgroundColor: NAVY } : undefined}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-[oklch(0.58_0.05_252)]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[oklch(0.92_0.01_252)] p-3 space-y-0.5">
        <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: NAVY }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[oklch(0.12_0.03_260)]">{displayName}</p>
            <p className="text-[11px] text-[oklch(0.50_0.04_252)]">Candidate</p>
          </div>
        </div>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-[oklch(0.45_0.04_252)] transition hover:bg-[oklch(0.95_0.008_252)] hover:text-[oklch(0.15_0.04_260)]"
        >
          <LogOut className="h-4 w-4 shrink-0" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "oklch(0.979 0.003 250)" }}>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-[oklch(0.92_0.01_252)] bg-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[oklch(0.92_0.01_252)] bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md text-white" style={{ backgroundColor: NAVY }}>
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-bold tracking-tight">Orcalis Assess</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-md p-1.5 text-[oklch(0.45_0.04_252)] hover:bg-muted">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[220px] flex-col border-r border-[oklch(0.92_0.01_252)] bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 px-5 py-6 lg:px-8 lg:py-8 mt-14 lg:mt-0">
        {children}
      </main>
    </div>
  );
}
