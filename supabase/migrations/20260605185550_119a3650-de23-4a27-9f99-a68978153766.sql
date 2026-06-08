
-- 1. organization_invitations: hide token column from client roles
REVOKE SELECT ON public.organization_invitations FROM authenticated, anon;
GRANT SELECT (id, organization_id, email, role, accepted_at, expires_at, created_at, invited_by)
  ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;

-- 2. exam_schedules: allow candidates to view schedules for their registrations
CREATE POLICY "Candidates view schedules for registered exams"
  ON public.exam_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_registrations r
      WHERE r.exam_id = exam_schedules.exam_id
        AND r.candidate_id = auth.uid()
    )
  );

-- 3. questions: restrict org-member SELECT to staff, add candidate-scoped policy
DROP POLICY IF EXISTS "Org members view questions" ON public.questions;

CREATE POLICY "Staff view questions"
  ON public.questions
  FOR SELECT
  USING (
    has_org_role(organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'instructor'::org_role, 'proctor'::org_role])
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Candidates view questions for registered exams"
  ON public.questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.exam_sections s
      JOIN public.exam_registrations r ON r.exam_id = s.exam_id
      WHERE s.id = questions.section_id
        AND r.candidate_id = auth.uid()
    )
  );

-- 4. Revoke EXECUTE from anon on SECURITY DEFINER functions that require auth.uid()
REVOKE EXECUTE ON FUNCTION public.get_exam_questions_for_attempt(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.submit_exam_attempt(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_exam_questions_for_attempt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exam_attempt(uuid) TO authenticated;
