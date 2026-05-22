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