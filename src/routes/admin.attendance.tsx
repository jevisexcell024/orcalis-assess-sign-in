import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  QrCode, MapPin, Fingerprint, Camera, Plus,
  Users2, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/attendance")({
  component: AttendancePage,
  head: () => ({ meta: [{ title: "Attendance · Orcalis Assess" }] }),
});

const METHODS = [
  { id: "qr",        label: "QR Code",    icon: QrCode,        desc: "Scan QR on mobile or kiosk" },
  { id: "gps",       label: "GPS",        icon: MapPin,         desc: "Location-based check-in" },
  { id: "biometric", label: "Biometric",  icon: Fingerprint,    desc: "Fingerprint scanner" },
  { id: "facial",    label: "Facial",     icon: Camera,         desc: "AI face recognition" },
];

// Mock sessions for demo (replace with real Supabase query once table is deployed)
const MOCK_SESSIONS = [
  { id: "1", title: "CS101 Final Exam Session", session_date: "2026-06-10", method: "qr",  present: 142, absent: 8, total: 150 },
  { id: "2", title: "Physics Practical",        session_date: "2026-06-08", method: "gps", present: 38,  absent: 2, total: 40 },
  { id: "3", title: "MBA Cohort Seminar",       session_date: "2026-06-05", method: "facial", present: 61, absent: 4, total: 65 },
];

function AttendancePage() {
  const [activeMethod, setActiveMethod] = useState("qr");
  const [creating, setCreating] = useState(false);

  const stats = {
    totalSessions: MOCK_SESSIONS.length,
    totalPresent: MOCK_SESSIONS.reduce((s, r) => s + r.present, 0),
    totalAbsent: MOCK_SESSIONS.reduce((s, r) => s + r.absent, 0),
    avgRate: Math.round(
      MOCK_SESSIONS.reduce((s, r) => s + (r.present / r.total) * 100, 0) / MOCK_SESSIONS.length,
    ),
  };

  return (
    <AdminShell
      title="Attendance Management"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Attendance" }]}
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Sessions", value: stats.totalSessions, icon: Clock,        cls: "text-foreground"   },
            { label: "Present",        value: stats.totalPresent,  icon: CheckCircle2, cls: "text-emerald-700"  },
            { label: "Absent",         value: stats.totalAbsent,   icon: XCircle,      cls: "text-rose-700"     },
            { label: "Avg Rate",       value: `${stats.avgRate}%`, icon: Users2,       cls: "text-sky-700"      },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Method selector & Create button */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold mb-3">Attendance Method</h2>
            <div className="flex flex-wrap gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMethod(m.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition",
                    activeMethod === m.id
                      ? "border-transparent text-white shadow-md"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                  style={activeMethod === m.id ? { background: "var(--gradient-primary)" } : undefined}
                >
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => setCreating(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Session
          </Button>
        </div>

        {/* QR Code Panel */}
        {activeMethod === "qr" && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <h3 className="text-base font-semibold">QR Attendance</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a time-limited QR code for students to scan on entry. QR refreshes every 30 seconds.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-muted/40 border-2 border-dashed border-border">
                <QrCode className="h-20 w-20 text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground">Select a session to generate QR code</p>
              <Button className="gap-1.5">
                <QrCode className="h-4 w-4" /> Generate QR for Session
              </Button>
            </div>
          </div>
        )}

        {/* GPS Panel */}
        {activeMethod === "gps" && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <h3 className="text-base font-semibold">GPS Attendance</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set a geo-fence radius. Students within the zone are automatically marked present.
            </p>
            <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-border">
              <div className="text-center">
                <MapPin className="mx-auto h-10 w-10 text-sky-500" />
                <p className="mt-2 text-sm font-medium">Map View</p>
                <p className="text-xs text-muted-foreground">Configure geo-fence in session settings</p>
              </div>
            </div>
          </div>
        )}

        {/* Sessions table */}
        <div>
          <h2 className="text-base font-semibold mb-3">Recent Sessions</h2>
          <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Session</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Attendance</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_SESSIONS.map((s) => {
                  const Method = METHODS.find((m) => m.id === s.method);
                  const rate = Math.round((s.present / s.total) * 100);
                  return (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{s.title}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{s.session_date}</td>
                      <td className="px-4 py-3">
                        {Method && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                            <Method.icon className="h-3 w-3" />
                            {Method.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-700 font-medium">{s.present}</span>
                        <span className="text-muted-foreground"> / {s.total}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs font-semibold">{rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted">
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
