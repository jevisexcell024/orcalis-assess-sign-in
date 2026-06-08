-- ============================================================
-- RLS Gap Coverage — production hardening
-- Fills missing INSERT/UPDATE/DELETE policies on sensitive tables
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. certificates
--    Existing: org_members_view_certificates (SELECT only)
--    Gaps: admins must INSERT/UPDATE/DELETE; revoke path
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "org_admins_manage_certificates"
  ON public.certificates
  FOR ALL
  USING  (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));

-- Students can view their own certificates (in addition to org-member view)
CREATE POLICY "students_view_own_certificates"
  ON public.certificates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 2. audit_logs
--    Existing: org_admins_view_audit_logs (SELECT only)
--    Gap: block direct INSERT from clients; only SECURITY DEFINER
--         function (create_audit_log) or service_role should write
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "block_direct_audit_log_insert"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (false);  -- no direct INSERT; use create_audit_log() SECURITY DEFINER fn

-- Super-admins may delete old logs (retention management)
CREATE POLICY "super_admins_delete_audit_logs"
  ON public.audit_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 3. integrity_checks
--    Existing: org_admins_view_integrity (SELECT only)
--    Gap: proctors and the AI service need to INSERT flags
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "proctors_insert_integrity_checks"
  ON public.integrity_checks
  FOR INSERT
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
  );

CREATE POLICY "org_admins_update_integrity_checks"
  ON public.integrity_checks
  FOR UPDATE
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));

-- ──────────────────────────────────────────────────────────────
-- 4. result_disputes
--    No prior policies — candidates submit; admins manage
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.result_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidates_submit_dispute"
  ON public.result_disputes
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "candidates_view_own_disputes"
  ON public.result_disputes
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "org_admins_manage_disputes"
  ON public.result_disputes
  FOR ALL
  USING (
    public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
  )
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
  );

-- ──────────────────────────────────────────────────────────────
-- 5. manual_grades
--    No prior policies — instructors write; candidates read own
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.manual_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instructors_manage_manual_grades"
  ON public.manual_grades
  FOR ALL
  USING (
    public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
  )
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
  );

CREATE POLICY "candidates_view_own_manual_grades"
  ON public.manual_grades
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts ea
      JOIN public.exam_registrations er ON er.id = ea.registration_id
      WHERE ea.id = attempt_id AND er.candidate_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 6. grading_rubrics / grade_scales
--    Gap: existing SELECT only; instructors need to create/update
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "instructors_manage_rubrics"
  ON public.grading_rubrics
  FOR ALL
  USING (
    public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
  )
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
  );

CREATE POLICY "org_admins_manage_grade_scales"
  ON public.grade_scales
  FOR ALL
  USING (
    public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[])
  )
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[])
  );

-- ──────────────────────────────────────────────────────────────
-- 7. device_sessions hardening
--    Existing: own_device_sessions (ALL for auth.uid() = user_id)
--    Gap: admins should be able to view/revoke for security audits
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "super_admins_view_device_sessions"
  ON public.device_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 8. messages — tighten: sender cannot read deleted messages
--    (Existing "own_messages" covers sender_id OR recipient_id but
--     doesn't filter deleted records — add a stricter view policy)
-- ──────────────────────────────────────────────────────────────
-- Drop the permissive policy and replace with separate SELECT + DML
ALTER POLICY "own_messages" ON public.messages
  USING (
    (auth.uid() = sender_id    AND deleted_by_sender    = false) OR
    (auth.uid() = recipient_id AND deleted_by_recipient = false)
  );

