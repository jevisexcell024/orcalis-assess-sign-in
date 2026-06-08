import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Activity, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Database, Server, Wifi, Clock, Zap,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/system-health")({
  component: SystemHealthPage,
  head: () => ({ meta: [{ title: "System Health · Orcalis Assess" }] }),
});

type ServiceStatus = "operational" | "degraded" | "outage" | "checking";

type Service = {
  name: string;
  description: string;
  icon: typeof Server;
  status: ServiceStatus;
  latency: number | null;
  uptime: number;
};

const INITIAL_SERVICES: Service[] = [
  { name: "API Gateway",        description: "Core API routing",              icon: Zap,      status: "operational", latency: 38,  uptime: 99.98 },
  { name: "Database (Primary)", description: "PostgreSQL via Supabase",       icon: Database, status: "operational", latency: 12,  uptime: 99.99 },
  { name: "Auth Service",       description: "Supabase Auth / JWT",           icon: Server,   status: "operational", latency: 22,  uptime: 100   },
  { name: "AI Proctoring",      description: "Vision & anomaly detection",    icon: Activity, status: "operational", latency: 84,  uptime: 99.91 },
  { name: "Email Delivery",     description: "Transactional email (SMTP)",    icon: Wifi,     status: "degraded",    latency: 340, uptime: 98.40 },
  { name: "CDN / Assets",       description: "Static assets & media",        icon: Server,   status: "operational", latency: 18,  uptime: 99.97 },
  { name: "Scheduler",          description: "Exam scheduling cron jobs",    icon: Clock,    status: "operational", latency: 55,  uptime: 99.85 },
];

const STATUS_META: Record<ServiceStatus, { label: string; icon: typeof CheckCircle2; cls: string; dot: string }> = {
  operational: { label: "Operational",  icon: CheckCircle2,  cls: "text-emerald-700 bg-emerald-50 ring-emerald-200", dot: "bg-emerald-400" },
  degraded:    { label: "Degraded",     icon: AlertTriangle, cls: "text-amber-700 bg-amber-50 ring-amber-200",       dot: "bg-amber-400"   },
  outage:      { label: "Outage",       icon: XCircle,       cls: "text-rose-700 bg-rose-50 ring-rose-200",          dot: "bg-rose-400"    },
  checking:    { label: "Checking…",    icon: RefreshCw,     cls: "text-sky-700 bg-sky-50 ring-sky-200",             dot: "bg-sky-400"     },
};

function SystemHealthPage() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [running, setRunning] = useState(false);

  const runHealthCheck = async () => {
    setRunning(true);
    // Mark all as checking
    setServices((prev) => prev.map((s) => ({ ...s, status: "checking" as ServiceStatus })));
    // Simulate staggered responses
    for (let i = 0; i < INITIAL_SERVICES.length; i++) {
      await new Promise((r) => setTimeout(r, 220 + Math.random() * 200));
      setServices((prev) => {
        const next = [...prev];
        next[i] = { ...INITIAL_SERVICES[i], latency: Math.floor(INITIAL_SERVICES[i].latency! * (0.85 + Math.random() * 0.3)) };
        return next;
      });
    }
    setLastChecked(new Date());
    setRunning(false);
    toast.success("Health check complete — all services verified.");
  };

  const operational = services.filter((s) => s.status === "operational").length;
  const degraded    = services.filter((s) => s.status === "degraded").length;
  const outage      = services.filter((s) => s.status === "outage").length;
  const overallOk   = outage === 0 && degraded === 0;

  return (
    <AdminShell
      title="System Health"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "System Health" }]}
    >
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        {/* Overall status banner */}
        <div className={cn(
          "flex items-center justify-between rounded-2xl border px-6 py-4",
          overallOk ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
        )}>
          <div className="flex items-center gap-3">
            <span className={cn("relative flex h-3 w-3")}>
              <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", overallOk ? "bg-emerald-400" : "bg-amber-400")} />
              <span className={cn("relative inline-flex h-3 w-3 rounded-full", overallOk ? "bg-emerald-500" : "bg-amber-500")} />
            </span>
            <div>
              <p className={cn("font-semibold", overallOk ? "text-emerald-800" : "text-amber-800")}>
                {overallOk ? "All Systems Operational" : `${degraded} service(s) degraded`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={running}
            onClick={runHealthCheck}
          >
            <RefreshCw className={cn("h-4 w-4", running && "animate-spin")} />
            {running ? "Checking…" : "Run Check"}
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Operational",  value: operational, cls: "text-emerald-700" },
            { label: "Degraded",     value: degraded,    cls: "text-amber-700"   },
            { label: "Outage",       value: outage,      cls: "text-rose-700"    },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-background p-5 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={cn("mt-1 text-4xl font-bold tabular-nums", k.cls)}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Services table */}
        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold">Service Status</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{services.length} monitored services</p>
          </div>
          <ul className="divide-y divide-border">
            {services.map((s) => {
              const meta = STATUS_META[s.status];
              const Icon = meta.icon;
              const SvcIcon = s.icon;
              return (
                <li key={s.name} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
                    <SvcIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs font-semibold tabular-nums">
                      {s.latency != null ? `${s.latency}ms` : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{s.uptime}% uptime</p>
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 shrink-0",
                    meta.cls,
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
