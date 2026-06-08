import { supabase } from "@/integrations/supabase/client";

export type AttendanceMethod = "qr" | "gps" | "biometric" | "facial" | "manual";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type AttendanceSession = {
  id: string;
  organization_id: string | null;
  exam_id: string | null;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  grace_period_minutes: number;
  method: AttendanceMethod;
  qr_code: string | null;
  qr_expires_at: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_radius_meters: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type AttendanceRecord = {
  id: string;
  session_id: string;
  student_id: string;
  organization_id: string | null;
  status: AttendanceStatus;
  method: AttendanceMethod | null;
  check_in_at: string | null;
  location_lat: number | null;
  location_lng: number | null;
  face_match_score: number | null;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function listAttendanceSessions(orgId?: string | null): Promise<AttendanceSession[]> {
  let q = (supabase as any)
    .from("attendance_sessions")
    .select("*")
    .order("session_date", { ascending: false });
  if (orgId) q = q.eq("organization_id", orgId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createAttendanceSession(input: {
  title: string;
  session_date: string;
  start_time: string;
  end_time?: string;
  method: AttendanceMethod;
  organization_id?: string;
  exam_id?: string;
  grace_period_minutes?: number;
  location_lat?: number;
  location_lng?: number;
  location_radius_meters?: number;
}): Promise<AttendanceSession> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const qr_code = input.method === "qr"
    ? `OA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    : null;
  const qr_expires_at = qr_code
    ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min
    : null;

  const { data, error } = await (supabase as any)
    .from("attendance_sessions")
    .insert({ ...input, created_by: user.id, qr_code, qr_expires_at })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await (supabase as any)
    .from("attendance_records")
    .select("*, students(full_name, student_number)")
    .eq("session_id", sessionId);
  if (error) throw error;
  return data ?? [];
}

export async function markAttendance(input: {
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  method?: AttendanceMethod;
  notes?: string;
  organization_id?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await (supabase as any)
    .from("attendance_records")
    .upsert({
      ...input,
      check_in_at: input.status !== "absent" ? new Date().toISOString() : null,
      marked_by: user?.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "session_id,student_id" });
  if (error) throw error;
}

export async function getAttendanceSummary(sessionId: string): Promise<{
  total: number; present: number; absent: number; late: number; excused: number; rate: number;
}> {
  const records = await listAttendanceRecords(sessionId);
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const excused = records.filter((r) => r.status === "excused").length;
  return { total, present, absent, late, excused, rate: total ? present / total : 0 };
}

export async function generateQRCode(sessionId: string): Promise<string> {
  const code = `OA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const { error } = await (supabase as any)
    .from("attendance_sessions")
    .update({ qr_code: code, qr_expires_at: expires, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
  return code;
}
