import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AlertTriangle, Mic, Users2, Wifi, Activity } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/live-monitor")({
  component: LiveMonitorPage,
  head: () => ({ meta: [{ title: "Live Monitor · Orcalis Assess" }] }),
});

const candidates = [
  { name: "Michael Chen", id: "8472910", risk: 85, status: "High Risk", flags: ["Gaze Loss", "Audio"], tone: "border-rose-300", chip: "bg-rose-500 text-white", action: "Intervene" },
  { name: "Sarah Williams", id: "8472911", risk: 12, status: "Normal", flags: ["Face Detected"], tone: "border-border", chip: "bg-emerald-500 text-white", action: null },
  { name: "David Kumar", id: "8472915", risk: 45, status: "Warning", flags: ["Focus Lost"], tone: "border-amber-300", chip: "bg-amber-500 text-white", action: "Send Warning" },
];

const trend = Array.from({ length: 12 }, (_, i) => ({ x: i, y: 10 + Math.sin(i / 2) * 6 + i }));

function LiveMonitorPage() {
  return (
    <AdminShell
      title="Advanced Mathematics 301"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Live Monitor" }]}
      actions={
        <>
          <span className="text-xs text-muted-foreground">01:45:22 Remaining · 142 Candidates</span>
          <Button variant="outline" className="ml-auto h-9">Pause Exam</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Users2 className="h-4 w-4" />} label="Active Candidates" value="138" sub="of 142 · 97% attendance" tone="bg-sky-500/10 text-sky-600" />
        <Stat icon={<AlertTriangle className="h-4 w-4" />} label="High Risk Alerts" value="3" sub="Requires immediate review" tone="bg-rose-500/10 text-rose-600" />
        <Stat icon={<Wifi className="h-4 w-4" />} label="Network Issues" value="12" sub="Candidates experiencing lag" tone="bg-amber-500/10 text-amber-600" />
        <Stat icon={<Activity className="h-4 w-4" />} label="System Health" value="99.9%" sub="All AI models optimal" tone="bg-emerald-500/10 text-emerald-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold tracking-tight">Live Monitor Grid</h3>
            <span className="text-xs text-muted-foreground">Filter: All · Grid</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c) => (
              <div key={c.id} className={`rounded-xl border-2 ${c.tone} bg-background p-3`}>
                <div className="relative flex h-36 items-center justify-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 text-xs text-muted-foreground">
                  <span className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-semibold ${c.chip}`}>
                    {c.status}
                  </span>
                  <span>Webcam feed</span>
                </div>
                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">ID: {c.id}</p>
                  </div>
                  <span className="text-xs font-semibold text-rose-600">{c.risk}% Risk</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.flags.map((f) => (
                    <Badge key={f} variant="outline" className="gap-1 border-rose-200 bg-rose-50 text-[10px] text-rose-600">
                      <Mic className="h-3 w-3" /> {f}
                    </Badge>
                  ))}
                </div>
                {c.action && (
                  <Button className="mt-3 h-8 w-full text-xs" variant={c.action === "Intervene" ? "destructive" : "outline"}>
                    {c.action}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <h3 className="text-sm font-semibold">Cohort Risk Trend</h3>
            <div className="mt-2 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <Area dataKey="y" stroke="oklch(0.58 0.22 262)" fill="oklch(0.58 0.22 262 / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Real-time Activity</h3>
              <Badge className="bg-emerald-500 text-white">Live</Badge>
            </div>
            <ul className="mt-3 space-y-3 text-xs">
              <Activity1 name="Michael Chen" event="triggered audio anomaly" detail="Multiple voices detected · Just now" tone="text-rose-600" />
              <Activity1 name="David Kumar" event="lost browser focus" detail="Switched to unknown application · 2 mins ago" tone="text-amber-600" />
              <Activity1 name="Emma Thompson" event="joined the exam" detail="Identity verified · 5 mins ago" tone="text-sky-600" />
            </ul>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function Stat({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tone}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Activity1({ name, event, detail, tone }: { name: string; event: string; detail: string; tone: string }) {
  return (
    <li>
      <p><span className={`font-semibold ${tone}`}>{name}</span> <span className="text-foreground">{event}</span></p>
      <p className="text-[11px] text-muted-foreground">{detail}</p>
    </li>
  );
}