import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ExamSchedule = Database["public"]["Tables"]["exam_schedules"]["Row"];
export type ExamRegistration = Database["public"]["Tables"]["exam_registrations"]["Row"];
export type ProctoringEvent = Database["public"]["Tables"]["proctoring_events"]["Row"];

export async function listSchedules() {
  const { data, error } = await supabase
    .from("exam_schedules")
    .select("*, exams(title, term)")
    .order("start_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createSchedule(input: {
  exam_id: string;
  start_at: string;
  end_at: string;
  timezone: string;
  max_concurrent: number;
  waitlist_enabled: boolean;
  notify_confirmation: boolean;
  notify_reminder: boolean;
  notify_proctors: boolean;
}) {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("exam_schedules")
    .insert({ ...input, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSchedule(
  id: string,
  patch: Partial<Database["public"]["Tables"]["exam_schedules"]["Update"]>,
) {
  const { data, error } = await supabase
    .from("exam_schedules")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listMyRegistrations() {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("exam_registrations")
    .select("*, exams(title, term), exam_schedules(start_at, end_at, timezone)")
    .eq("candidate_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMyRegistration(id: string) {
  const { data, error } = await supabase
    .from("exam_registrations")
    .select("*, exams(title, term)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateRegistration(
  id: string,
  patch: Partial<Database["public"]["Tables"]["exam_registrations"]["Update"]>,
) {
  const { data, error } = await supabase
    .from("exam_registrations")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------- Admin / monitoring ----------

export async function listRegistrationsForSchedule(scheduleId: string) {
  const { data, error } = await supabase
    .from("exam_registrations")
    .select("*")
    .eq("schedule_id", scheduleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function countAllRegistrations() {
  const { count, error } = await supabase
    .from("exam_registrations")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function listRecentProctoringEvents(limit = 25, scheduleId?: string) {
  let q = supabase
    .from("proctoring_events")
    .select("*, exam_registrations!inner(schedule_id, candidate_id)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (scheduleId) {
    q = q.eq("exam_registrations.schedule_id", scheduleId);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export function pickActiveSchedule<T extends { start_at: string; end_at: string }>(
  schedules: T[],
): T | null {
  const now = Date.now();
  const live = schedules.find(
    (s) => new Date(s.start_at).getTime() <= now && new Date(s.end_at).getTime() >= now,
  );
  if (live) return live;
  const upcoming = schedules
    .filter((s) => new Date(s.start_at).getTime() > now)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())[0];
  return upcoming ?? schedules[0] ?? null;
}

// ---------- Analytics ----------

export type AnalyticsSummary = {
  averageScore: number | null;
  highestScore: number | null;
  totalCompleted: number;
  passingRate: number | null;
  passingThreshold: number;
  totalRegistrations: number;
  scoreDistribution: { bucket: string; count: number }[];
  perExam: { exam: string; average: number; completed: number }[];
};

const PASSING_THRESHOLD = 60;

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data, error } = await supabase
    .from("exam_registrations")
    .select("score, status, exam_id")
    .eq("status", "completed");
  if (error) throw error;

  const rows = data ?? [];
  const scored = rows.filter(
    (r): r is typeof r & { score: number } => typeof r.score === "number",
  );

  const totalCompleted = rows.length;
  const averageScore = scored.length
    ? scored.reduce((a, r) => a + r.score, 0) / scored.length
    : null;
  const highestScore = scored.length ? Math.max(...scored.map((r) => r.score)) : null;
  const passingRate = scored.length
    ? (scored.filter((r) => r.score >= PASSING_THRESHOLD).length / scored.length) * 100
    : null;

  const buckets = [
    { bucket: "0–20", min: 0, max: 20 },
    { bucket: "21–40", min: 21, max: 40 },
    { bucket: "41–60", min: 41, max: 60 },
    { bucket: "61–80", min: 61, max: 80 },
    { bucket: "81–100", min: 81, max: 100 },
  ];
  const scoreDistribution = buckets.map((b) => ({
    bucket: b.bucket,
    count: scored.filter((r) => r.score >= b.min && r.score <= b.max).length,
  }));

  const byExamId = new Map<string, { sum: number; count: number }>();
  for (const r of scored) {
    const cur = byExamId.get(r.exam_id) ?? { sum: 0, count: 0 };
    cur.sum += r.score;
    cur.count += 1;
    byExamId.set(r.exam_id, cur);
  }
  const examIds = Array.from(byExamId.keys());
  let titleById = new Map<string, string>();
  if (examIds.length) {
    const { data: exams } = await supabase
      .from("exams")
      .select("id, title")
      .in("id", examIds);
    titleById = new Map((exams ?? []).map((e) => [e.id, e.title]));
  }
  const perExam = Array.from(byExamId.entries())
    .map(([id, v]) => ({
      exam: titleById.get(id) ?? "Untitled",
      average: v.sum / v.count,
      completed: v.count,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 8);

  const totalReg = await countAllRegistrations();

  return {
    averageScore,
    highestScore,
    totalCompleted,
    passingRate,
    passingThreshold: PASSING_THRESHOLD,
    totalRegistrations: totalReg,
    scoreDistribution,
    perExam,
  };
}

// ---------- Billing / audit ----------

export type BillingSummary = {
  totalRegistrations: number;
  totalCompleted: number;
  activeCandidates: number;
  totalProctoringEvents: number;
  highSeverityEvents: number;
  usageByDay: { day: string; exams: number; flags: number }[];
  candidatesSpark: { i: number; v: number }[];
};

export async function getBillingSummary(): Promise<BillingSummary> {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [{ data: regs, error: regErr }, { data: events, error: evErr }, totalRegistrations] = await Promise.all([
    supabase
      .from("exam_registrations")
      .select("status, candidate_id, created_at")
      .gte("created_at", since.toISOString()),
    supabase
      .from("proctoring_events")
      .select("severity, created_at")
      .gte("created_at", since.toISOString()),
    countAllRegistrations(),
  ]);
  if (regErr) throw regErr;
  if (evErr) throw evErr;

  const regRows = regs ?? [];
  const evRows = events ?? [];

  const days: { day: string; exams: number; flags: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const exams = regRows.filter((r) => r.created_at.slice(0, 10) === key).length;
    const flags = evRows.filter((e) => e.created_at.slice(0, 10) === key).length;
    days.push({ day: label, exams, flags });
  }

  const candidatesSpark = days.slice(-24).map((d, i) => ({ i, v: d.exams }));
  const activeCandidates = new Set(regRows.map((r) => r.candidate_id)).size;
  const highSeverityEvents = evRows.filter((e) => e.severity === "high").length;

  return {
    totalRegistrations,
    totalCompleted: regRows.filter((r) => r.status === "completed").length,
    activeCandidates,
    totalProctoringEvents: evRows.length,
    highSeverityEvents,
    usageByDay: days,
    candidatesSpark,
  };
}

export type AuditLogRow = {
  id: string;
  ts: string;
  event: string;
  resource: string;
  status: "Success" | "Failed" | "Warning";
  severity: string;
  registration_id: string;
};

export async function listAuditLogs(limit = 25): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from("proctoring_events")
    .select("id, created_at, event_type, message, severity, registration_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((e) => ({
    id: e.id,
    ts: new Date(e.created_at).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    event: e.event_type,
    resource: e.message ?? "Proctoring",
    status: e.severity === "high" ? "Failed" : e.severity === "warning" ? "Warning" : "Success",
    severity: e.severity,
    registration_id: e.registration_id,
  }));
}

// ---------- Super admin dashboard overview ----------

export type DashboardOverview = {
  activeCandidates: number;
  activeExams: number;
  totalInterventions: number;
  systemHealthPct: number;
  usageByHour: { t: string; v: number }[];
  violationTypes: { name: string; value: number; color: string }[];
  recentInterventions: Array<{
    id: string;
    candidate: string;
    candidateId: string;
    exam: string;
    violation: string;
    severity: "info" | "warning" | "high";
    confidence: number;
    at: string;
  }>;
  totalEventCount: number;
};

const VIOLATION_PALETTE = [
  "oklch(0.65 0.22 22)",
  "oklch(0.78 0.17 70)",
  "oklch(0.55 0.22 275)",
  "oklch(0.7 0.17 162)",
  "oklch(0.6 0.2 320)",
];

function humanizeEvent(type: string): string {
  return type
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = Date.now();
  const dayAgoIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [examsRes, attemptsRes, eventsRes, regsRes] = await Promise.all([
    supabase.from("exams").select("id, title, status"),
    supabase
      .from("exam_attempts")
      .select("id, started_at, submitted_at, registration_id")
      .is("submitted_at", null),
    supabase
      .from("proctoring_events")
      .select("id, event_type, severity, message, created_at, registration_id")
      .gte("created_at", dayAgoIso)
      .order("created_at", { ascending: false }),
    supabase
      .from("exam_registrations")
      .select("id, candidate_id, exam_id"),
  ]);

  if (examsRes.error) throw examsRes.error;
  if (attemptsRes.error) throw attemptsRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (regsRes.error) throw regsRes.error;

  const exams = examsRes.data ?? [];
  const attempts = attemptsRes.data ?? [];
  const events = eventsRes.data ?? [];
  const regs = regsRes.data ?? [];

  const examById = new Map(exams.map((e) => [e.id, e]));
  const regById = new Map(regs.map((r) => [r.id, r]));

  const activeCandidates = attempts.length;
  const activeExams = exams.filter((e) => e.status === "published").length;
  const totalInterventions = events.length;
  const highSeverity = events.filter((e) => e.severity === "high").length;
  const systemHealthPct = totalInterventions
    ? Math.max(80, 100 - (highSeverity / totalInterventions) * 20)
    : 99.98;

  // Usage by hour (last 24h) — count attempt starts per hour bucket.
  const buckets: { t: string; v: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now - i * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    buckets.push({
      t: `${String(d.getHours()).padStart(2, "0")}:00`,
      v: 0,
    });
  }
  for (const a of attempts) {
    const t = new Date(a.started_at).getTime();
    const hoursAgo = Math.floor((now - t) / (60 * 60 * 1000));
    if (hoursAgo >= 0 && hoursAgo < 24) {
      buckets[23 - hoursAgo].v += 1;
    }
  }

  // Violation distribution
  const counts = new Map<string, number>();
  for (const e of events) {
    counts.set(e.event_type, (counts.get(e.event_type) ?? 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const violationTypes = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, n], i) => ({
      name: humanizeEvent(name),
      value: total ? Math.round((n / total) * 100) : 0,
      color: VIOLATION_PALETTE[i % VIOLATION_PALETTE.length],
    }));

  // Recent interventions: warning + high only
  const flagged = events.filter((e) => e.severity !== "info").slice(0, 10);
  const candidateIds = Array.from(
    new Set(
      flagged
        .map((e) => regById.get(e.registration_id)?.candidate_id)
        .filter((x): x is string => !!x),
    ),
  );
  let profileByUser = new Map<string, { contact_name: string | null; email: string }>();
  if (candidateIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, contact_name, email")
      .in("user_id", candidateIds);
    profileByUser = new Map(
      (profs ?? []).map((p) => [p.user_id, { contact_name: p.contact_name, email: p.email }]),
    );
  }

  const recentInterventions = flagged.map((e) => {
    const reg = regById.get(e.registration_id);
    const prof = reg ? profileByUser.get(reg.candidate_id) : undefined;
    const exam = reg ? examById.get(reg.exam_id) : undefined;
    const ageMs = now - new Date(e.created_at).getTime();
    const ageMin = Math.floor(ageMs / 60000);
    const at =
      ageMin < 1 ? "Just now" : ageMin < 60 ? `${ageMin} min ago` : `${Math.floor(ageMin / 60)}h ago`;
    return {
      id: e.id,
      candidate: prof?.contact_name ?? prof?.email ?? "Candidate",
      candidateId: reg?.candidate_id?.slice(0, 8) ?? "—",
      exam: exam?.title ?? "Exam",
      violation: humanizeEvent(e.event_type),
      severity: e.severity as "info" | "warning" | "high",
      confidence: e.severity === "high" ? 95 : 80,
      at,
    };
  });

  return {
    activeCandidates,
    activeExams,
    totalInterventions,
    systemHealthPct,
    usageByHour: buckets,
    violationTypes,
    recentInterventions,
    totalEventCount: totalInterventions,
  };
}