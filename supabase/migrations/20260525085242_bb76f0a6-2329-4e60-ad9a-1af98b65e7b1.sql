-- =============================================================================
-- MULTI-TENANCY: ORGANIZATIONS
-- =============================================================================

-- Org role enum
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'instructor', 'proctor', 'member');

-- Organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_created_by ON public.organizations(created_by);

-- Membership
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);

-- Invitations
CREATE TABLE public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_invites_email ON public.organization_invitations(email);
CREATE INDEX idx_org_invites_org ON public.organization_invitations(organization_id);

-- =============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER, avoid RLS recursion)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org_id uuid, _roles public.org_role[], _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id
      AND user_id = _user_id
      AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_orgs(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = _user_id;
$$;

-- =============================================================================
-- RLS — ORGANIZATIONS
-- =============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view their orgs" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users create orgs" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners and admins update orgs" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.has_org_role(id, ARRAY['owner','admin']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_org_role(id, ARRAY['owner','admin']::public.org_role[])
              OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Only owners delete orgs" ON public.organizations
  FOR DELETE TO authenticated
  USING (public.has_org_role(id, ARRAY['owner']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'));

-- =============================================================================
-- RLS — ORGANIZATION_MEMBERS
-- =============================================================================

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see members of their orgs" ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owners and admins add members" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[])
    OR (
      -- Bootstrap: a user creating an org can add themselves as owner
      user_id = auth.uid()
      AND role = 'owner'
      AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.created_by = auth.uid())
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Owners and admins update members" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[])
              OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owners and admins remove members" ON public.organization_members
  FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'));

-- =============================================================================
-- RLS — ORGANIZATION_INVITATIONS
-- =============================================================================

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins view invitations" ON public.organization_invitations
  FOR SELECT TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org admins create invitations" ON public.organization_invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[])
              AND invited_by = auth.uid());

CREATE POLICY "Org admins delete invitations" ON public.organization_invitations
  FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'));

-- =============================================================================
-- LINK EXISTING TABLES TO ORGANIZATIONS
-- =============================================================================

ALTER TABLE public.exams ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.exam_schedules ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.exam_registrations ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.questions ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_exams_org ON public.exams(organization_id);
CREATE INDEX idx_schedules_org ON public.exam_schedules(organization_id);
CREATE INDEX idx_registrations_org ON public.exam_registrations(organization_id);
CREATE INDEX idx_questions_org ON public.questions(organization_id);

-- =============================================================================
-- REWRITE RLS ON TENANT TABLES (org-scoped)
-- =============================================================================

-- EXAMS
DROP POLICY IF EXISTS "Super admins manage exams" ON public.exams;
DROP POLICY IF EXISTS "Proctors view exams" ON public.exams;
DROP POLICY IF EXISTS "Candidates view registered exams" ON public.exams;

CREATE POLICY "Org members view exams" ON public.exams
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(organization_id)
    OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (SELECT 1 FROM public.exam_registrations r WHERE r.exam_id = exams.id AND r.candidate_id = auth.uid())
  );

CREATE POLICY "Instructors manage exams" ON public.exams
  FOR ALL TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
              OR public.has_role(auth.uid(), 'super_admin'));

-- EXAM_SCHEDULES
DROP POLICY IF EXISTS "Admins manage schedules" ON public.exam_schedules;
DROP POLICY IF EXISTS "Candidates view schedules" ON public.exam_schedules;

CREATE POLICY "Org members view schedules" ON public.exam_schedules
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Instructors manage schedules" ON public.exam_schedules
  FOR ALL TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
              OR public.has_role(auth.uid(), 'super_admin'));

-- EXAM_REGISTRATIONS
DROP POLICY IF EXISTS "Admins manage registrations" ON public.exam_registrations;
DROP POLICY IF EXISTS "Block non-admin updates to registrations" ON public.exam_registrations;
DROP POLICY IF EXISTS "Candidates create own registrations" ON public.exam_registrations;
DROP POLICY IF EXISTS "Candidates view own registrations" ON public.exam_registrations;
DROP POLICY IF EXISTS "Proctors view registrations" ON public.exam_registrations;

CREATE POLICY "Candidates view own registrations v2" ON public.exam_registrations
  FOR SELECT TO authenticated
  USING (auth.uid() = candidate_id);

CREATE POLICY "Org staff view registrations" ON public.exam_registrations
  FOR SELECT TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor','proctor']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Candidates create own registrations v2" ON public.exam_registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = candidate_id
    AND status = 'pending'
    AND system_check_passed = false
    AND identity_verified = false
    AND score IS NULL
  );

CREATE POLICY "Org staff manage registrations" ON public.exam_registrations
  FOR ALL TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
              OR public.has_role(auth.uid(), 'super_admin'));

-- RESTRICTIVE: candidates may not update sensitive fields (org staff still can via permissive policy above)
CREATE POLICY "Block candidate updates to registrations" ON public.exam_registrations
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (
    public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- QUESTIONS
DROP POLICY IF EXISTS "Super admins manage questions" ON public.questions;
DROP POLICY IF EXISTS "Proctors view questions" ON public.questions;
DROP POLICY IF EXISTS "Candidates view questions for registered exams" ON public.questions;

CREATE POLICY "Org members view questions" ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(organization_id)
    OR public.has_role(auth.uid(), 'super_admin')
    OR (section_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.exam_sections s
      JOIN public.exam_registrations r ON r.exam_id = s.exam_id
      WHERE s.id = questions.section_id AND r.candidate_id = auth.uid()
    ))
  );

CREATE POLICY "Instructors manage questions" ON public.questions
  FOR ALL TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[])
              OR public.has_role(auth.uid(), 'super_admin'));

-- =============================================================================
-- TRIGGER: auto-create org on first signup (institution onboarding)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_org()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_inst text;
  v_slug text;
BEGIN
  v_inst := COALESCE(NEW.raw_user_meta_data ->> 'institution_name', split_part(NEW.email, '@', 1) || '''s Workspace');
  v_slug := lower(regexp_replace(v_inst, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8);

  INSERT INTO public.organizations (name, slug, created_by)
  VALUES (v_inst, v_slug, NEW.id)
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

-- Hook into existing handle_new_user by chaining a separate trigger
DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;
CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_org();

-- updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();