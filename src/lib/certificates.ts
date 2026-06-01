import { supabase } from "@/integrations/supabase/client";

export type Certificate = {
  id: string;
  result_id: string;
  student_id: string;
  organization_id: string | null;
  exam_id: string | null;
  certificate_number: string;
  issued_at: string;
  expires_at: string | null;
  template_id: string | null;
  pdf_url: string | null;
  qr_code: string | null;
  blockchain_hash: string | null;
  blockchain_tx: string | null;
  revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_at: string;
};

export async function listCertificates(orgId?: string | null): Promise<Certificate[]> {
  let q = (supabase as any)
    .from("certificates")
    .select("*, students(full_name, student_number), exams(title)")
    .order("issued_at", { ascending: false });
  if (orgId) q = q.eq("organization_id", orgId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getMyCertificates(): Promise<Certificate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Find the student record for this user
  const { data: studentData } = await (supabase as any)
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!studentData) return [];

  const { data, error } = await (supabase as any)
    .from("certificates")
    .select("*, exams(id, title, term)")
    .eq("student_id", studentData.id)
    .eq("revoked", false)
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function verifyCertificate(certNumber: string): Promise<{
  valid: boolean;
  certificate: Certificate | null;
  student: { full_name: string; student_number: string } | null;
  exam: { title: string } | null;
  organization: { name: string } | null;
}> {
  const { data, error } = await (supabase as any)
    .from("certificates")
    .select(`
      *,
      students(full_name, student_number),
      exams(title),
      organizations(name)
    `)
    .eq("certificate_number", certNumber)
    .single();

  if (error || !data) {
    return { valid: false, certificate: null, student: null, exam: null, organization: null };
  }

  const expired = data.expires_at ? new Date(data.expires_at) < new Date() : false;
  return {
    valid: !data.revoked && !expired,
    certificate: data,
    student: data.students,
    exam: data.exams,
    organization: data.organizations,
  };
}

export async function issueCertificate(input: {
  result_id: string;
  student_id: string;
  exam_id: string;
  organization_id?: string;
  expires_at?: string;
}): Promise<Certificate> {
  const { data, error } = await (supabase as any)
    .from("certificates")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function revokeCertificate(id: string, reason: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("certificates")
    .update({ revoked: true, revoked_at: new Date().toISOString(), revoked_reason: reason })
    .eq("id", id);
  if (error) throw error;
}
