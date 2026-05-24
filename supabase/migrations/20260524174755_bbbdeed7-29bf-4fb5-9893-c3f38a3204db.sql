-- Block candidates (and any non-admin) from updating exam_registrations.
-- Score, status, identity_verified, and system_check_passed must only be
-- changed by trusted admin code.

-- Defensive: drop any prior versions of these policies if they exist.
DROP POLICY IF EXISTS "Only admins may update registrations" ON public.exam_registrations;
DROP POLICY IF EXISTS "Block non-admin updates to registrations" ON public.exam_registrations;

-- Restrictive policy: every UPDATE must satisfy this (in addition to any permissive policy).
CREATE POLICY "Block non-admin updates to registrations"
ON public.exam_registrations
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));