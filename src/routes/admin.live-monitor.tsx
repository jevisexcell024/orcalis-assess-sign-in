import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AlertTriangle, Mic, Users2, Wifi, Activity } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  listSchedules,
  listRegistrationsForSchedule,
  listRecentProctoringEvents,
  pickActiveSchedule,
} from "@/lib/scheduling";

export const Route = createFileRoute("/admin/live-monitor")({
  component: LiveMonitorPage,
  head: () => ({ meta: [{ title: "Live Monitor · Orcalis Assess" }] }),
});

function severityToTone(sev: string) {
  if (sev === "high")
    return { card: "border-rose-300", chip: "bg-rose-500 text-white", status: "High Risk", action: "Intervene" as const, text: "text-rose-600" };
  if (sev === "warning")
    return { card: "border-amber-300", chip: "bg-amber-500 text-white", status: "Warning", action: "Send Warning" as const, text: "text-amber-600" };
  return { card: "border-border", chip: "bg-emerald-500 text-white", status: "Normal", action: null, text: "text-sky-600" };
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleString();
}

function LiveMonitorPage() {
  const qc = useQueryClient();
  const schedulesQ = useQuery({ queryKey: ["schedules"], queryFn: listSchedules });
  const active = useMemo(
    () => (schedulesQ.data ? pickActiveSchedule(schedulesQ.data) : null),
    [schedulesQ.data],
  );
  const scheduleId = active?.id;

  const regsQ = useQuery({
    queryKey: ["live-monitor", "regs", scheduleId],
    queryFn: () => (scheduleId ? listRegistrationsForSchedule(scheduleId) : Promise.resolve([])),
    enabled: !!scheduleId,
  });

  const eventsQ = useQuery({
    queryKey: ["live-monitor", "events", scheduleId],
    queryFn: () => listRecentProctoringEvents(25, scheduleId),
    enabled: !!scheduleId,
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!scheduleId) return;
    const ch = supabase
      .channel(`live-monitor-${scheduleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "exam_registrations", filter: `schedule_id=eq.${scheduleId}` }, () => {
        qc.invalidateQueries({ queryKey: ["live-monitor", "regs", scheduleId] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "proctoring_events" }, () => {
        qc.invalidateQueries({ queryKey: ["live-monitor", "events", scheduleId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [scheduleId, qc]);

  const regs = regsQ.data ?? [];
  const events = eventsQ.data ?? [];

  // Map registration -> highest severity event
  const eventsByReg = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const arr = map.get(e.registration_id) ?? [];
      arr.push(e);
      map.set(e.registration_id, arr);
    }
    return map;
  }, [events]);

  const stats = useMemo(() => {
    const total = regs.length;
    const inProgress = regs.filter((r) => r.status === "confirmed").length;
    const highRisk = regs.filter((r) => {
      const evs = eventsByReg.get(r.id) ?? [];
      return evs.some((e) => e.severity === "high");
    }).length;
    const network = events.filter((e) => e.event_type.toLowerCase().includes("network")).length;
    return { total, inProgress, highRisk, network };
  }, [regs, events, eventsByReg]);

  const trend = useMemo(() => {
    // last 12 5-min buckets of event counts
    const now = Date.now();
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const start = now - (11 - i) * 5 * 60 * 1000;
      const end = start + 5 * 60 * 1000;
      return {
        x: i,
        y: events.filter((e) => {
          const t = new Date(e.created_at).getTime();
          return t >= start && t < end;
        }).length,
      };
    });
    return buckets;
  }, [events]);

  if (schedulesQ.isLoading) {
    return (
      <AdminShell title="Live Monitor" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Live Monitor" }]}>
        <div className="rounded-2xl border border-border bg-background p-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      </AdminShell>
    );
  }

  if (!active) {
    return (
      <AdminShell title="Live Monitor" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Live Monitor" }]}>
        <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center">
          <Activity className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No active or upcoming exam sessions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a schedule to begin proctoring candidates here.
          </p>
        </div>
      </AdminShell>
    );
  }

  const examTitle = (active as { exams?: { title?: string } | null }).exams?.title ?? "Exam Session";
  const now = Date.now();
  const endsAt = new Date(active.end_at).getTime();
  const startsAt = new Date(active.start_at).getTime();
  const remainingMs = endsAt - now;
  const isLive = now >= startsAt && now <= endsAt;
  const remainingLabel = isLive && remainingMs > 0
    ? `${String(Math.floor(remainingMs / 3600000)).padStart(2, "0")}:${String(Math.floor((remainingMs % 3600000) / 60000)).padStart(2, "0")} remaining`
    : new Date(active.start_at).toLocaleString();

  return (
    <AdminShell
      title={examTitle}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Live Monitor" }]}
      actions={
        <>
          <span className="text-xs text-muted-foreground">
            {remainingLabel} · {regs.length} {regs.length === 1 ? "candidate" : "candidates"}
          </span>
          {isLive && <Badge className="ml-2 bg-emerald-500 text-white">Live</Badge>}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Users2 className="h-4 w-4" />}
          label="Active Candidates"
          value={String(stats.inProgress)}
          sub={`of ${stats.total} registered`}
          tone="bg-sky-500/10 text-sky-600"
        />
        <Stat
          icon={<AlertTriangle className="h-4 w-4" />}
          label="High Risk Alerts"
          value={String(stats.highRisk)}
          sub="Requires immediate review"
          tone="bg-rose-500/10 text-rose-600"
        />
        <Stat
          icon={<Wifi className="h-4 w-4" />}
          label="Network Issues"
          value={String(stats.network)}
          sub="Recent network events"
          tone="bg-amber-500/10 text-amber-600"
        />
        <Stat
          icon={<Activity className="h-4 w-4" />}
          label="Recent Events"
          value={String(events.length)}
          sub="In current view"
          tone="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold tracking-tight">Live Monitor Grid</h3>
            <span className="text-xs text-muted-foreground">{regs.length} candidates</span>
          </div>
          {regs.length === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No candidates registered for this session yet.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regs.map((r) => {
                const evs = eventsByReg.get(r.id) ?? [];
                const top = evs[0];
                const sev = top?.severity ?? "info";
                const tone = severityToTone(sev);
                const flags = evs.slice(0, 3).map((e) => e.event_type);
                const shortId = r.candidate_id.slice(0, 8);
                return (
                  <div key={r.id} className={`rounded-xl border-2 ${tone.card} bg-background p-3`}>
                    <div className="relative flex h-36 items-center justify-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 text-xs text-muted-foreground">
                      <span className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-semibold ${tone.chip}`}>
                        {tone.status}
                      </span>
                      <span>Awaiting feed</span>
                    </div>
                    <div className="mt-3 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">Candidate #{shortId}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{r.status.replace("_", " ")}</p>
                      </div>
                      <span className={`text-xs font-semibold ${tone.text}`}>{evs.length} event{evs.length === 1 ? "" : "s"}</span>
                    </div>
                    {flags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {flags.map((f, i) => (
                          <Badge key={`${f}-${i}`} variant="outline" className="gap-1 border-rose-200 bg-rose-50 text-[10px] text-rose-600">
                            <Mic className="h-3 w-3" /> {f}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {tone.action && (
                      <Button className="mt-3 h-8 w-full text-xs" variant={tone.action === "Intervene" ? "destructive" : "outline"}>
                        {tone.action}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <h3 className="text-sm font-semibold">Event Trend (last 60 min)</h3>
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
            {events.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No events yet.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-xs">
                {events.slice(0, 8).map((e) => {
                  const tone = severityToTone(e.severity).text;
                  const shortId = e.registration_id.slice(0, 8);
                  return (
                    <Activity1
                      key={e.id}
                      name={`Candidate #${shortId}`}
                      event={e.event_type}
                      detail={`${e.message ?? "—"} · ${fmtRelative(e.created_at)}`}
                      tone={tone}
                    />
                  );
                })}
              </ul>
            )}
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