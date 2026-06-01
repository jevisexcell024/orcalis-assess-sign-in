import { supabase } from "@/integrations/supabase/client";

export type ResultStatus =
  | "pending" | "auto_graded" | "under_review" | "moderated" | "approved" | "published" | "disputed";

export type Result = {
  id: string;
  attempt_id: string;
  registration_id: string;
  organization_id: string | null;
  raw_score: number | null;
  max_score: number | null;
  percentage: number | null;
  grade: string | null;
  grade_points: number | null;
  status: ResultStatus;
  auto_graded_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type GradeBand = { label: string; min: number; max: number; points: number };

const DEFAULT_BANDS: GradeBand[] = [
  { label: "A", min: 90, max: 100, points: 4.0 },
  { label: "B", min: 75, max: 89,  points: 3.0 },
  { label: "C", min: 60, max: 74,  points: 2.0 },
  { label: "D", min: 50, max: 59,  points: 1.0 },
  { label: "F", min: 0,  max: 49,  points: 0.0 },
];

export function getGrade(percentage: number, bands: GradeBand[] = DEFAULT_BANDS): GradeBand {
  return bands.find((b) => percentage >= b.min && percentage <= b.max) ?? bands[bands.length - 1];
}

export async function listResults(orgId?: string | null): Promise<Result[]> {
  let q = (supabase as any)
    .from("results")
    .select("*, exam_attempts(id, submitted_at), exam_registrations(id, exams(title))")
    .order("created_at", { ascending: false });
  if (orgId) q = q.eq("organization_id", orgId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getMyResults(): Promise<Result[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Join through exam_registrations → candidate_id
  const { data, error } = await (supabase as any)
    .from("results")
    .select(`
      *,
      exam_attempts(id, submitted_at),
      exam_registrations!inner(id, candidate_id, exams(id, title, term))
    `)
    .eq("exam_registrations.candidate_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function approveResult(resultId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await (supabase as any)
    .from("results")
    .update({
      status: "approved",
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", resultId);
  if (error) throw error;
}

export async function publishResults(orgId: string): Promise<{ count: number }> {
  const { data, error } = await (supabase as any)
    .from("results")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", orgId)
    .eq("status", "approved")
    .select("id");
  if (error) throw error;
  return { count: (data ?? []).length };
}

export async function submitDispute(input: {
  result_id: string;
  student_id: string;
  reason: string;
  evidence_urls?: string[];
}): Promise<void> {
  const { error } = await (supabase as any).from("result_disputes").insert(input);
  if (error) throw error;
}

export async function getResultStats(orgId?: string | null): Promise<{
  total: number;
  pending: number;
  autoGraded: number;
  published: number;
  avgPercentage: number;
  passRate: number;
}> {
  let q = (supabase as any).from("results").select("status, percentage");
  if (orgId) q = q.eq("organization_id", orgId);
  const { data, error } = await q;
  if (error) throw error;
  const rows: Result[] = data ?? [];
  const withPct = rows.filter((r) => r.percentage != null);
  const avgPct = withPct.length
    ? withPct.reduce((s, r) => s + (r.percentage ?? 0), 0) / withPct.length
    : 0;
  const passed = withPct.filter((r) => (r.percentage ?? 0) >= 50).length;
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    autoGraded: rows.filter((r) => r.status === "auto_graded").length,
    published: rows.filter((r) => r.status === "published").length,
    avgPercentage: avgPct,
    passRate: withPct.length ? passed / withPct.length : 0,
  };
}
