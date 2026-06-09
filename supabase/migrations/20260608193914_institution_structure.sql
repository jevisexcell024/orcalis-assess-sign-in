-- ============================================================
-- Institution Structure Tables
-- faculties, departments, programs, campuses, academic_years
-- ============================================================

CREATE TABLE IF NOT EXISTS public.faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  dean TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_faculties_org ON public.faculties(organization_id);
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_view_faculties" ON public.faculties
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_faculties" ON public.faculties
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));
CREATE TRIGGER tg_faculties_updated BEFORE UPDATE ON public.faculties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  head TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_departments_org ON public.departments(organization_id);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_view_departments" ON public.departments
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_departments" ON public.departments
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));
CREATE TRIGGER tg_departments_updated BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  level TEXT CHECK (level IN ('certificate','diploma','undergraduate','postgraduate','doctoral')),
  duration_years NUMERIC(3,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_programs_org ON public.programs(organization_id);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_view_programs" ON public.programs
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_programs" ON public.programs
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));
CREATE TRIGGER tg_programs_updated BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  is_main BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_campuses_org ON public.campuses(organization_id);
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_view_campuses" ON public.campuses
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_campuses" ON public.campuses
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));
CREATE TRIGGER tg_campuses_updated BEFORE UPDATE ON public.campuses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_academic_years_org ON public.academic_years(organization_id);
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_view_academic_years" ON public.academic_years
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_academic_years" ON public.academic_years
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));
CREATE TRIGGER tg_academic_years_updated BEFORE UPDATE ON public.academic_years
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
