import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  QrCode, MapPin, Fingerprint, Camera, Plus,
  Users2, CheckCircle2, XCircle, Clock, Download,
  RefreshCw, Eye, X, Search, Check, AlertCircle,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/csv";
import {
  listAttendanceSessions,
  createAttendanceSession,
  listAttendanceRecords,
  markAttendance,
  generateQRCode,
  type AttendanceSession,
  type AttendanceRecord,
  type AttendanceMethod,
  type AttendanceStatus,
} from "@/lib/attendance";
import { listStudents, type Student } from "@/lib/students";

export const Route = createFileRoute("/admin/attendance")({
  component: AttendancePage,
  head: () => ({ meta: [{ title: "Attendance · Orcalis Assess" }] }),
});

const NAVY = "oklch(0.385 0.12 247)";

const METHODS: { id: AttendanceMethod; label: string; icon: any; desc: string }[] = [
  { id: "qr",        label: "QR Code",   icon: QrCode,       desc: "Scan rotating QR on mobile" },
  { id: "gps",       label: "GPS",       icon: MapPin,       desc: "Location-based check-in" },
  { id: "biometric", label: "Biometric", icon: Fingerprint,  desc: "Fingerprint scanner" },
  { id: "facial",    label: "Facial",    icon: Camera,       desc: "AI face recognition" },
  { id: "manual",    label: "Manual",    icon: Users2,       desc: "Proctor marks attendance" },
];

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  absent:   "bg-rose-50    text-rose-700    border-rose-200",
  late:     "bg-amber-50   text-amber-700   border-amber-200",
  excused:  "bg-sky-50     text-sky-700     border-sky-200",
};

// ─── QR Canvas renderer ───────────────────────────────────────
function QRCanvas({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Simple QR-style grid rendering from hash of value
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const cells = 25;
    const cell = size / cells;
    // deterministic pattern from value chars
    const seed = Array.from(value).reduce((a, c) => a + c.charCodeAt(0), 0);
    ctx.fillStyle = "#1a1a2e";
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const pos = r * cells + c;
        const hash = (seed * (pos + 1) * 2654435761) >>> 0;
        // Always fill finder patterns (corners)
        const inFinder =
          (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
        if (inFinder || (hash % 3 === 0 && r > 7 && c > 7)) {
          ctx.fillRect(c * cell, r * cell, cell - 0.5, cell - 0.5);
        }
      }
    }
    // finder pattern separators (white inner)
    ctx.fillStyle = "#ffffff";
    [[1,1,5,5],[1,cells-8,5,5],[cells-8,1,5,5]].forEach(([x,y,w,h]) => {
      ctx.fillRect((x)*cell,(y)*cell,(w)*cell,(h)*cell);
    });
    ctx.fillStyle = "#1a1a2e";
    [[2,2,3,3],[2,cells-7,3,3],[cells-7,2,3,3]].forEach(([x,y,w,h]) => {
      ctx.fillRect((x)*cell,(y)*cell,(w)*cell,(h)*cell);
    });
    // Centre label
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillRect(size*0.3, size*0.44, size*0.4, size*0.12);
    ctx.fillStyle = "#1a1a2e";
    ctx.font = `bold ${Math.round(size*0.055)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(value.slice(0, 12), size/2, size*0.525);
  }, [value, size]);
  return <canvas ref={canvasRef} className="rounded-lg border border-border shadow-sm" />;
}

// ─── Session Detail Modal ─────────────────────────────────────
function SessionDetailModal({
  session,
  onClose,
}: {
  session: AttendanceSession;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [qrCode, setQrCode] = useState(session.qr_code ?? "");
  const [refreshing, setRefreshing] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance-records", session.id],
    queryFn: () => listAttendanceRecords(session.id),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const s = search.toLowerCase();
    return records.filter((r: any) =>
      r.students?.full_name?.toLowerCase().includes(s) ||
      r.students?.student_number?.toLowerCase().includes(s)
    );
  }, [records, search]);

  const present = records.filter((r) => r.status === "present").length;
  const absent  = records.filter((r) => r.status === "absent").length;
  const late    = records.filter((r) => r.status === "late").length;
  const rate    = records.length ? Math.round((present / records.length) * 100) : 0;

  const markMutation = useMutation({
    mutationFn: (args: { student_id: string; status: AttendanceStatus }) =>
      markAttendance({ session_id: session.id, ...args }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance-records", session.id] }),
    onError: () => toast.error("Failed to update attendance"),
  });

  const handleRefreshQR = async () => {
    setRefreshing(true);
    try {
      const newCode = await generateQRCode(session.id);
      setQrCode(newCode);
      qc.invalidateQueries({ queryKey: ["admin", "attendance-sessions"] });
      toast.success("QR code refreshed");
    } catch {
      toast.error("Failed to refresh QR");
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    exportToCSV(`attendance-${session.id.slice(0,8)}.csv`, records as any[], [
      { key: "students.student_number", header: "Student No." },
      { key: "students.full_name",      header: "Name" },
      { key: "status",                  header: "Status" },
      { key: "check_in_at",             header: "Check-In Time" },
      { key: "method",                  header: "Method" },
      { key: "notes",                   header: "Notes" },
    ]);
    toast.success("Exported");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{session.title}</h2>
            <p className="text-sm text-muted-foreground">{session.session_date} · {session.method.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total",   value: records.length, cls: "text-foreground"  },
              { label: "Present", value: present,        cls: "text-emerald-700" },
              { label: "Absent",  value: absent,         cls: "text-rose-700"    },
              { label: "Rate",    value: `${rate}%`,     cls: "text-sky-700"     },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                <p className={cn("text-2xl font-bold", s.cls)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-6">
            {/* QR Code (if QR session) */}
            {session.method === "qr" && (
              <div className="flex flex-col items-center gap-3">
                <QRCanvas value={qrCode || "PENDING"} size={180} />
                <p className="text-xs font-mono font-medium text-center">{qrCode}</p>
                <p className="text-[11px] text-muted-foreground">Expires every 30 min</p>
                <Button size="sm" variant="outline" className="gap-1.5"
                  onClick={handleRefreshQR} disabled={refreshing}>
                  <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                  Refresh QR
                </Button>
              </div>
            )}

            {/* Records table */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student…" className="pl-8 h-8 text-sm" />
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
              </div>
              <div className="rounded-xl border border-border overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/30 border-b border-border">
                    <tr className="text-[11px] uppercase tracking-wider text-muted-foreground text-left">
                      <th className="px-3 py-2 font-medium">Student</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Check-In</th>
                      <th className="px-3 py-2 font-medium">Mark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                        {records.length === 0 ? "No records. Students check in via QR or mark manually below." : "No matches."}
                      </td></tr>
                    ) : (
                      filtered.map((rec: any) => (
                        <tr key={rec.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2">
                            <p className="font-medium text-sm">{rec.students?.full_name ?? rec.student_id.slice(0,8)}</p>
                            <p className="text-[11px] text-muted-foreground">{rec.students?.student_number}</p>
                          </td>
                          <td className="px-3 py-2">
                            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", STATUS_COLORS[rec.status as AttendanceStatus])}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {rec.check_in_at ? new Date(rec.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              {(["present","late","excused","absent"] as AttendanceStatus[]).map((st) => (
                                <button key={st} title={st}
                                  onClick={() => markMutation.mutate({ student_id: rec.student_id, status: st })}
                                  className={cn("h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold border transition",
                                    rec.status === st ? "text-white border-transparent" : "bg-background border-border hover:bg-muted",
                                    rec.status === st && st === "present"  ? "bg-emerald-600" : "",
                                    rec.status === st && st === "absent"   ? "bg-rose-600"    : "",
                                    rec.status === st && st === "late"     ? "bg-amber-500"   : "",
                                    rec.status === st && st === "excused"  ? "bg-sky-600"     : "",
                                  )}>
                                  {st[0].toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Session Modal ─────────────────────────────────────
function CreateSessionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    session_date: new Date().toISOString().slice(0, 10),
    start_time: new Date().toISOString().slice(0, 16),
    method: "qr" as AttendanceMethod,
    grace_period_minutes: 15,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Session title required"); return; }
    setSaving(true);
    try {
      await createAttendanceSession({
        title: form.title,
        session_date: form.session_date,
        start_time: new Date(form.start_time).toISOString(),
        method: form.method,
        grace_period_minutes: form.grace_period_minutes,
      });
      toast.success("Session created");
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">New Attendance Session</h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <Label>Session Title</Label>
            <Input className="mt-1" placeholder="e.g. MAT301 Lecture – Week 12"
              value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" className="mt-1"
                value={form.session_date} onChange={(e) => setForm((p) => ({ ...p, session_date: e.target.value }))} />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input type="datetime-local" className="mt-1"
                value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Attendance Method</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button key={m.id} onClick={() => setForm((p) => ({ ...p, method: m.id }))}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition",
                    form.method === m.id ? "border-transparent text-white shadow-md" : "border-border bg-background hover:bg-muted",
                  )}
                  style={form.method === m.id ? { background: NAVY } : undefined}>
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Grace Period (minutes)</Label>
            <Input type="number" min={0} max={60} className="mt-1 w-28"
              value={form.grace_period_minutes}
              onChange={(e) => setForm((p) => ({ ...p, grace_period_minutes: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="text-white" style={{ background: NAVY }}>
            {saving ? "Creating…" : "Create Session"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
function AttendancePage() {
  const qc = useQueryClient();
  const [activeMethod, setActiveMethod] = useState<AttendanceMethod>("qr");
  const [creating, setCreating]     = useState(false);
  const [detailSession, setDetail]  = useState<AttendanceSession | null>(null);
  const [search, setSearch]         = useState("");

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["admin", "attendance-sessions"],
    queryFn: () => listAttendanceSessions(),
    refetchInterval: 60_000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const s = search.toLowerCase();
    return sessions.filter((ses) => ses.title.toLowerCase().includes(s));
  }, [sessions, search]);

  // Aggregate stats across all sessions
  const stats = useMemo(() => ({
    totalSessions: sessions.length,
    qrSessions:    sessions.filter((s) => s.method === "qr").length,
    todaySessions: sessions.filter((s) => s.session_date === new Date().toISOString().slice(0, 10)).length,
    activeSessions: sessions.filter((s) => {
      const now = new Date();
      const start = new Date(s.start_time);
      const end = s.end_time ? new Date(s.end_time) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      return now >= start && now <= end;
    }).length,
  }), [sessions]);

  return (
    <AdminShell
      title="Attendance Management"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Attendance" }]}
      actions={
        <Button size="sm" className="gap-1.5 text-white" style={{ background: NAVY }}
          onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New Session
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-[1300px] space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Sessions", value: stats.totalSessions,  icon: Clock,        cls: "text-foreground"   },
            { label: "Today",          value: stats.todaySessions,  icon: CheckCircle2, cls: "text-emerald-700"  },
            { label: "Active Now",     value: stats.activeSessions, icon: AlertCircle,  cls: "text-amber-600"    },
            { label: "QR Sessions",   value: stats.qrSessions,     icon: QrCode,       cls: "text-sky-700"      },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={cn("text-2xl font-bold tabular-nums", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Method selector */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Method Overview</h2>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => {
              const count = sessions.filter((s) => s.method === m.id).length;
              return (
                <button key={m.id} onClick={() => setActiveMethod(m.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                    activeMethod === m.id ? "text-white shadow-md" : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                  style={activeMethod === m.id ? { background: NAVY } : undefined}>
                  <m.icon className="h-4 w-4" />
                  {m.label}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    activeMethod === m.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Method description card */}
          {(() => {
            const m = METHODS.find((m) => m.id === activeMethod)!;
            return (
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <m.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{m.label} Attendance</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  {activeMethod === "qr" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      QR codes rotate every 30 minutes to prevent sharing. Select a session below to view and refresh the live QR code.
                    </p>
                  )}
                  {activeMethod === "gps" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Students within the configured geo-fence radius are automatically marked present when they open the student app.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Sessions table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Sessions</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search sessions…" className="pl-8 h-8 text-sm w-52" />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                exportToCSV("attendance-sessions.csv", sessions as any[], [
                  { key: "title",        header: "Session" },
                  { key: "session_date", header: "Date" },
                  { key: "method",       header: "Method" },
                  { key: "start_time",   header: "Start" },
                  { key: "created_at",   header: "Created" },
                ]);
                toast.success("Exported sessions");
              }}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Session</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Start Time</th>
                  <th className="px-4 py-3 font-medium">QR Code</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">Loading sessions…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users2 className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No attendance sessions yet</p>
                      <Button size="sm" className="gap-1.5 text-white mt-1" style={{ background: NAVY }}
                        onClick={() => setCreating(true)}>
                        <Plus className="h-4 w-4" /> Create First Session
                      </Button>
                    </div>
                  </td></tr>
                ) : (
                  filtered.map((session) => {
                    const m = METHODS.find((m) => m.id === session.method);
                    const isActive = (() => {
                      const now = new Date();
                      const start = new Date(session.start_time);
                      const end = session.end_time ? new Date(session.end_time) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
                      return now >= start && now <= end;
                    })();
                    return (
                      <tr key={session.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isActive && (
                              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            <p className="font-medium">{session.title}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{session.session_date}</td>
                        <td className="px-4 py-3">
                          {m && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                              <m.icon className="h-3 w-3" /> {m.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(session.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {session.qr_code ? (
                            <span className="rounded-md bg-muted px-2 py-1">{session.qr_code}</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" className="gap-1.5"
                            onClick={() => setDetail(session)}>
                            <Eye className="h-3.5 w-3.5" /> View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {filtered.length > 0 && (
              <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
                {filtered.length} session{filtered.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {creating && (
        <CreateSessionModal
          onClose={() => setCreating(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["admin", "attendance-sessions"] })}
        />
      )}
      {detailSession && (
        <SessionDetailModal session={detailSession} onClose={() => setDetail(null)} />
      )}
    </AdminShell>
  );
}
