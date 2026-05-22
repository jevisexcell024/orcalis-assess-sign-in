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