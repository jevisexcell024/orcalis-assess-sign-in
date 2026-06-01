import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";

const nav = [
  { label: "Dashboard",     to: "/student",                icon: Home        },
  { label: "My Exams",      to: "/student/exams",          icon: NotebookPen },
  { label: "My Results",    to: "/student/results",        icon: BarChart2   },
  { label: "Attendance",    to: "/student/attendance",     icon: CalendarDays},
  { label: "Certificates",  to: "/student/certificates",   icon: Award       },
  { label: "Announcements", to: "/student/announcements",  icon: Bell        },
  { label: "Payments",      to: "/student/payments",       icon: CreditCard  },
  { label: "Profile",       to: "/student/profile",        icon: User        },
  { label: "Practice Tests",to: "/student/practice",       icon: Sparkles    },
] as const;

export function StudentShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-[oklch(0.985_0.005_260)]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Orcalis Assess</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 pt-4">
          {nav.map((item) => {
            const active =
              item.to === "/student"
                ? pathname === "/student"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                  active
                    ? "font-semibold text-white shadow-sm"
                    : "text-foreground/75 hover:bg-muted hover:text-foreground",
                )}
                style={active ? { background: "var(--gradient-primary)" } : undefined}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-xs font-semibold text-white">
              AC
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Alex Carter</p>
              <p className="truncate text-xs text-muted-foreground">Candidate · Level 3</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}