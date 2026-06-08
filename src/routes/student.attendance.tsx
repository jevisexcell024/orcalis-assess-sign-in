import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, AlertCircle, CalendarDays, TrendingUp } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/student/attendance")({
  component: StudentAttendancePage,
  head: () => ({ meta: [{ title: "My Attendance · Orcalis Assess" }] }),
});

// For students, we read attendance_records joined to attendance_sessions
async function fetchMyAttendance() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Get student record
  const { data: student } = await (supabase as any)
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!student) return [];

  const { data, error } = await (supabase as any)
    .from("attendance_records")
    .select("*, attendance_sessions(title, session_date, method, start_time)")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  present: { label: "Present", icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50 ring-emerald-200" },
  absent:  { label: "Absent",  icon: XCircle,      cls: "text-rose-600 bg-rose-50 ring-rose-200"         },
  late:    { label: "Late",    icon: Clock,         cls: "text-amber-600 bg-amber-50 ring-amber-200"      },
  excused: { label: "Excused", icon: AlertCircle,   cls: "text-sky-600 bg-sky-50 ring-sky-200"            },
};

function StudentAttendancePage() {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["student", "attendance"],
    queryFn: fetchMyAttendance,
  });

  const total = records.length;
  const present = records.filter((r: any) => r.status === "present" || r.status === "late").length;
  const absent  = records.filter((r: any) => r.status === "absent").length;
  const rate    = total ? Math.round((present / total) * 100) : 0;

  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
          <p className="text-sm text-muted-foreground">Track your presence across all exam sessions.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Sessions",    value: total,   cls: "text-foreground"  },
            { label: "Present / Late",    value: present, cls: "text-emerald-700" },
            { label: "Absent",            value: absent,  cls: "text-rose-700"    },
            { label: "Attendance Rate",   value: `${rate}%`, cls: rate >= 75 ? "text-emerald-700" : "text-rose-700" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Attendance rate bar */}
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Overall Attendance Rate</span>
            </div>
            <span className={cn("text-sm font-bold", rate >= 75 ? "text-emerald-700" : "text-rose-700")}>
              {rate}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", rate >= 75 ? "bg-emerald-500" : "bg-rose-500")}
              style={{ width: `${rate}%` }}
            />
          </div>
          {rate < 75 && (
            <p className="mt-2 text-xs text-rose-600">
              ⚠ Your attendance is below the 75% minimum requirement. Contact your academic advisor.
            </p>
          )}
        </div>

        {/* Records table */}
        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold">Session History</h3>
          </div>
          {isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading attendance…</div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {records.map((r: any) => {
                const session = r.attendance_sessions;
                const meta = STATUS_META[r.status] ?? STATUS_META.absent;
                const Icon = meta.icon;
                return (
                  <div key={r.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20">
                    <div className="flex items-center gap-4">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", meta.cls)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{session?.title ?? "Session"}</p>
                        <p className="text-xs text-muted-foreground">
                          {session?.session_date} · {session?.method?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", meta.cls)}>
                        {meta.label}
                      </span>
                      {r.check_in_at && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Checked in {new Date(r.check_in_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
}
