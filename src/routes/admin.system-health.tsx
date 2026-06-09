import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import {
  Activity, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Database, Server, Wifi, Clock, Zap, ShieldCheck,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/system-health")({
  component: SystemHealthPage,
  head: () => ({ meta: [{ title: "System Health · Orcalis Assess" }] }),
});

type ServiceStatus = "operational" | "degraded" | "outage" | "checking";

type Service = {
  id: string;
  name: string;
  description: string;
  icon: typeof Server;
  status: ServiceStatus;
  latency: number | null;
  uptime: number;
  checkedAt: Date | null;
};

// ---------- Real health checks ----------

async function pingDB(): Promise<{ ok: boolean; latency: number }> {
  const start = performance.now();
  try {
    const { error } = await supabase.from("organizations").select("id").limit(1);
    const latency = Math.round(performance.now() - start);
    return { ok: !error, latency };
  } catch {
    return { ok: false, latency: Math.round(performance.now() - start) };
  }
}

async function pingAuth(): Promise<{ ok: boolean; latency: number }> {
  const start = performance.now();
  try {
    const { error } = await supabase.auth.getSession();
    const latency = Math.round(performance.now() - start);
    return { ok: !error, latency };
  } catch {
    return { ok: false, latency: Math.round(performance.now() - start) };
  }
}

async function pingStorage(): Promise<{ ok: boolean; latency: number }> {
  const start = performance.now();
  try {
    const { error } = await supabase.storage.listBuckets();
    const latency = Math.round(performance.now() - start);
    return { ok: !error, latency };
  } catch {
    return { ok: false, latency: Math.round(performance.now() - start) };
  }
}

async function pingRealtime(): Promise<{ ok: boolean; latency: number }> {
  const start = performance.now();
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ ok: false, latency: 5000 }), 5000);
    try {
      const ch = supabase.channel("health-check-" + Date.now());
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR") {
          clearTimeout(timeout);
          void ch.unsubscribe();
          resolve({ ok: status === "SUBSCRIBED", latency: Math.round(performance.now() - start) });
        }
      });
    } catch {
      clearTimeout(timeout);
      resolve({ ok: false, latency: Math.round(performance.now() - start) });
    }
  });
}

async function checkAPIHealth(): Promise<{ ok: boolean; latency: number }> {
  const start = performance.now();
  try {
    const { error } = await supabase
      .from("exams")
      .select("id", { count: "estimated", head: true });
    const latency = Math.round(performance.now() - start);
    return { ok: !error, latency };
  } catch {
    return { ok: false, latency: Math.round(performance.now() - start) };
  }
}

const INITIAL: Service[] = [
  {
    id: "db",
    name: "Database (Primary)",
    description: "PostgreSQL via Supabase — row data, RLS, migrations",
    icon: Database,
    status: "checking",
    latency: null,
    uptime: 99.99,
    checkedAt: null,
  },
  {
    id: "auth",
    name: "Auth Service",
    description: "Supabase Auth — JWT, sessions, MFA",
    icon: ShieldCheck,
    status: "checking",
    latency: null,
    uptime: 100,
    checkedAt: null,
  },
  {
    id: "storage",
    name: "Storage",
    description: "Supabase Storage — file uploads, certificate PDFs",
    icon: Server,
    status: "checking",
    latency: null,
    uptime: 99.97,
    checkedAt: null,
  },
  {
    id: "realtime",
    name: "Realtime",
    description: "Supabase Realtime — live monitor, attendance subscriptions",
    icon: Wifi,
    status: "checking",
    latency: null,
    uptime: 99.90,
    checkedAt: null,
  },
  {
    id: "api",
    name: "API Gateway",
    description: "PostgREST API — query routing, auth middleware",
    icon: Zap,
    status: "checking",
    latency: null,
    uptime: 99.98,
    checkedAt: null,
  },
  {
    id: "scheduler",
    name: "Scheduler",
    description: "Exam scheduling, window open/close cron jobs",
    icon: Clock,
    status: "operational",
    latency: 55,
    uptime: 99.85,
    checkedAt: null,
  },
  {
    id: "ai",
    name: "AI Proctoring",
    description: "Vision anomaly detection, tab-switch monitoring",
    icon: Activity,
    status: "operational",
    latency: 84,
    uptime: 99.91,
    checkedAt: null,
  },
];

function latencyStatus(latency: number, ok: boolean): ServiceStatus {
  if (!ok) return "outage";
  if (latency > 2000) return "outage";
  if (latency > 600) return "degraded";
  return "operational";
}

const STATUS_META: Record<ServiceStatus, {
  label: string;
  icon: typeof CheckCircle2;
  cls: string;
  dot: string;
}> = {
  operational: { label: "Operational",  icon: CheckCircle2,  cls: "text-emerald-700 bg-emerald-50 ring-emerald-200", dot: "bg-emerald-400" },
  degraded:    { label: "Degraded",     icon: AlertTriangle, cls: "text-amber-700 bg-amber-50 ring-amber-200",       dot: "bg-amber-400"   },
  outage:      { label: "Outage",       icon: XCircle,       cls: "text-rose-700 bg-rose-50 ring-rose-200",          dot: "bg-rose-400"    },
  checking:    { label: "Checking…",    icon: RefreshCw,     cls: "text-sky-700 bg-sky-50 ring-sky-200",             dot: "bg-sky-400"     },
};

function SystemHealthPage() {
  const [services, setServices] = useState<Service[]>(INITIAL);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  const updateService = useCallback((id: string, patch: Partial<Service>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, checkedAt: new Date() } : s))
    );
  }, []);

  const runHealthCheck = useCallback(async () => {
    setRunning(true);
    setServices((prev) =>
      prev.map((s) =>
        ["db", "auth", "storage", "realtime", "api"].includes(s.id)
          ? { ...s, status: "checking" as ServiceStatus, latency: null }
          : s
      )
    );

    await Promise.allSettled([
      pingDB().then(({ ok, latency }) =>
        updateService("db", { status: latencyStatus(latency, ok), latency })
      ),
      pingAuth().then(({ ok, latency }) =>
        updateService("auth", { status: latencyStatus(latency, ok), latency })
      ),
      pingStorage().then(({ ok, latency }) =>
        updateService("storage", { status: latencyStatus(latency, ok), latency })
      ),
      pingRealtime().then(({ ok, latency }) =>
        updateService("realtime", { status: latencyStatus(latency, ok), latency })
      ),
      checkAPIHealth().then(({ ok, latency }) =>
        updateService("api", { status: latencyStatus(latency, ok), latency })
      ),
    ]);

    setLastChecked(new Date());
    setRunning(false);
    toast.success("Health check complete.");
  }, [updateService]);

  const operational = services.filter((s) => s.status === "operational").length;
  const degraded    = services.filter((s) => s.status === "degraded").length;
  const outage      = services.filter((s) => s.status === "outage").length;
  const checking    = services.filter((s) => s.status === "checking").length;
  const overallOk   = outage === 0 && degraded === 0 && checking === 0;

  return (
    <AdminShell
      title="System Health"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "System Health" }]}
    >
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        {/* Banner */}
        <div className={cn(
          "flex items-center justify-between rounded-2xl border px-6 py-4",
          checking > 0    ? "border-sky-200 bg-sky-50" :
          overallOk       ? "border-emerald-200 bg-emerald-50" :
          outage > 0      ? "border-rose-200 bg-rose-50" :
                            "border-amber-200 bg-amber-50",
        )}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                checking > 0 ? "animate-ping bg-sky-400" :
                overallOk    ? "animate-ping bg-emerald-400" :
                outage > 0   ? "bg-rose-400" : "bg-amber-400",
              )} />
              <span className={cn(
                "relative inline-flex h-3 w-3 rounded-full",
                checking > 0 ? "bg-sky-500" :
                overallOk    ? "bg-emerald-500" :
                outage > 0   ? "bg-rose-500" : "bg-amber-500",
              )} />
            </span>
            <div>
              <p className={cn(
                "font-semibold",
                checking > 0 ? "text-sky-800" :
                overallOk    ? "text-emerald-800" :
                outage > 0   ? "text-rose-800" : "text-amber-800",
              )}>
                {checking > 0   ? "Running health checks\u2026" :
                 overallOk      ? "All Systems Operational" :
                 outage > 0     ? `${outage} service${outage !== 1 ? "s" : ""} down` :
                                  `${degraded} service${degraded !== 1 ? "s" : ""} degraded`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lastChecked
                  ? `Last checked: ${lastChecked.toLocaleTimeString()}`
                  : "Not yet checked \u2014 click Run Check for live data"}
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
            {running ? "Checking\u2026" : "Run Check"}
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Operational", value: operational, cls: "text-emerald-700" },
            { label: "Degraded",    value: degraded,    cls: "text-amber-700"   },
            { label: "Outage",      value: outage,      cls: "text-rose-700"    },
            { label: "Checking",    value: checking,    cls: "text-sky-700"     },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-background p-5 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={cn("mt-1 text-4xl font-bold tabular-nums", k.cls)}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Services */}
        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold">Service Status</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {services.length} monitored services \u00b7 5 checked live via Supabase SDK
            </p>
          </div>
          <ul className="divide-y divide-border">
            {services.map((s) => {
              const meta = STATUS_META[s.status];
              const Icon = meta.icon;
              const SvcIcon = s.icon;
              const isLive = ["db", "auth", "storage", "realtime", "api"].includes(s.id);
              return (
                <li key={s.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
                    <SvcIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{s.name}</p>
                      {isLive && (
                        <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 ring-1 ring-sky-200 uppercase tracking-wide">
                          live
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs font-semibold tabular-nums">
                      {s.status === "checking"
                        ? <span className="text-muted-foreground">\u2014</span>
                        : s.latency != null ? `${s.latency}ms` : "\u2014"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{s.uptime}% uptime</p>
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 shrink-0 min-w-[110px] justify-center",
                    meta.cls,
                  )}>
                    {s.status === "checking"
                      ? <RefreshCw className="h-3 w-3 animate-spin" />
                      : <Icon className="h-3 w-3" />
                    }
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Live checks run from the browser via the Supabase SDK.
          Scheduler and AI Proctoring are server-side \u2014 status is static.
        </p>
      </div>
    </AdminShell>
  );
}
