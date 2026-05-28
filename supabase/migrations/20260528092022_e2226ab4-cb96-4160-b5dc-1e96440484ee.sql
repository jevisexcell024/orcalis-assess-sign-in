
-- 1. Invitation token exposure: drop existing admin SELECT policy and replace
-- with one that excludes token visibility via a column-safe view pattern.
-- Simpler fix: keep policy but revoke SELECT on token column from authenticated.
REVOKE SELECT (token) ON public.organization_invitations FROM authenticated, anon;
GRANT SELECT (token) ON public.organization_invitations TO service_role;

-- 2. Candidate registration tamper: add explicit restrictive DELETE policy
-- that prevents candidates from deleting their registrations.
DROP POLICY IF EXISTS "Block candidate deletes to registrations" ON public.exam_registrations;
CREATE POLICY "Block candidate deletes to registrations"
ON public.exam_registrations
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (
  has_org_role(organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'instructor'::org_role])
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 3. SECURITY DEFINER helpers must not be callable by anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, org_role[], uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_orgs(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_org() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, org_role[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_orgs(uuid) TO authenticated;
