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