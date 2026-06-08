import { supabase } from "@/integrations/supabase/client";

export type EnrollmentStatus = "active" | "suspended" | "graduated" | "withdrawn" | "deferred";

export type Student = {
  id: string;
  user_id: string;
  organization_id: string | null;
  student_number: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  department: string | null;
  program: string | null;
  year_of_study: number | null;
  enrollment_status: EnrollmentStatus;
  enrolled_at: string | null;
  expected_graduation_date: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademicRecord = {
  id: string;
  student_id: string;
  organization_id: string | null;
  course_code: string;
  course_name: string;
  credit_hours: number;
  grade: string | null;
  grade_points: number | null;
  semester: string | null;
  academic_year: string | null;
  status: "enrolled" | "completed" | "failed" | "withdrawn" | "incomplete";
  created_at: string;
  updated_at: string;
};

export async function listStudents(orgId?: string | null): Promise<Student[]> {
  let q = (supabase as any).from("students").select("*").order("full_name");
  if (orgId) q = q.eq("organization_id", orgId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getStudent(id: string): Promise<Student | null> {
  const { data, error } = await (supabase as any)
    .from("students")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createStudent(input: {
  full_name: string;
  student_number: string;
  organization_id?: string;
  department?: string;
  program?: string;
  year_of_study?: number;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
}): Promise<Student> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await (supabase as any)
    .from("students")
    .insert({ ...input, user_id: user.id, enrollment_status: "active" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudent(id: string, patch: Partial<Student>): Promise<void> {
  const { error } = await (supabase as any)
    .from("students")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await (supabase as any).from("students").delete().eq("id", id);
  if (error) throw error;
}

export async function listAcademicRecords(studentId: string): Promise<AcademicRecord[]> {
  const { data, error } = await (supabase as any)
    .from("academic_records")
    .select("*")
    .eq("student_id", studentId)
    .order("academic_year", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function calculateGPA(records: AcademicRecord[]): Promise<number> {
  const completed = records.filter((r) => r.status === "completed" && r.grade_points != null);
  if (!completed.length) return 0;
  const totalPoints = completed.reduce((s, r) => s + (r.grade_points ?? 0) * r.credit_hours, 0);
  const totalCredits = completed.reduce((s, r) => s + r.credit_hours, 0);
  return totalCredits ? totalPoints / totalCredits : 0;
}
