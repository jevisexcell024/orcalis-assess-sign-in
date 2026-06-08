
CREATE POLICY "Candidates view sections for registered exams"
ON public.exam_sections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exam_registrations r
    WHERE r.exam_id = exam_sections.exam_id
      AND r.candidate_id = auth.uid()
  )
);

CREATE POLICY "Proctors view sections"
ON public.exam_sections
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'proctor'::app_role));

CREATE POLICY "Candidates view questions for registered exams"
ON public.questions
FOR SELECT
TO authenticated
USING (
  section_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.exam_sections s
    JOIN public.exam_registrations r ON r.exam_id = s.exam_id
    WHERE s.id = questions.section_id
      AND r.candidate_id = auth.uid()
  )
);

CREATE POLICY "Proctors view questions"
ON public.questions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'proctor'::app_role));

CREATE POLICY "Only super admins may insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super admins may update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super admins may delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
