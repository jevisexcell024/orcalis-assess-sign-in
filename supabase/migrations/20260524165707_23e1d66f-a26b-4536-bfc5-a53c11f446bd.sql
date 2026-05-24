
-- Fix 1: Prevent candidates from tampering with their own scores/verification status
-- Replace the overly permissive ALL policy with SELECT + INSERT only.
DROP POLICY IF EXISTS "Candidates manage own registrations" ON public.exam_registrations;

CREATE POLICY "Candidates view own registrations"
ON public.exam_registrations
FOR SELECT
TO authenticated
USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates create own registrations"
ON public.exam_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = candidate_id
  AND status = 'pending'::registration_status
  AND system_check_passed = false
  AND identity_verified = false
  AND score IS NULL
);
-- Note: UPDATE/DELETE on exam_registrations is now restricted to super_admins
-- (via existing "Admins manage registrations" policy). Score, identity verification,
-- and system check status must be set server-side by admin/proctor logic.

-- Fix 2: Allow candidates (for registered exams) and proctors to read exam metadata
CREATE POLICY "Candidates view registered exams"
ON public.exams
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exam_registrations r
    WHERE r.exam_id = exams.id AND r.candidate_id = auth.uid()
  )
);

CREATE POLICY "Proctors view exams"
ON public.exams
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'proctor'::app_role));
