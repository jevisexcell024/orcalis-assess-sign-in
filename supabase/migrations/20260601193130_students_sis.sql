-- ============================================================
-- Student Information System (SIS)
-- ============================================================

-- Extended student profile
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  nationality TEXT,
  phone TEXT,
  address TEXT,
  photo_url TEXT,
  department TEXT,
  program TEXT,
  year_of_study INTEGER,
  enrollment_status TEXT NOT NULL DEFAULT 'active'
    CHECK (enrollment_status IN ('active','suspended','graduated','withdrawn','deferred')),
  enrolled_at DATE,
  expected_graduation_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, student_number)
);

-- Academic records (grades per course)
CREATE TABLE IF NOT EXISTS public.academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  credit_hours INTEGER NOT NULL DEFAULT 3,
  grade TEXT,
  grade_points NUMERIC(3,2),
  semester TEXT,
  academic_year TEXT,
  status TEXT NOT NULL DEFAULT 'enrolled'
    CHECK (status IN ('enrolled','completed','failed','withdrawn','incomplete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student documents
CREATE TABLE IF NOT EXISTS public.student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  document_type TEXT NOT NULL
    CHECK (document_type IN ('id_card','birth_certificate','transcript','admission_letter','passport','other')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_students" ON public.students
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "org_admins_manage_students" ON public.students
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[]));

CREATE POLICY "org_members_view_academic_records" ON public.academic_records
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "org_admins_manage_academic_records" ON public.academic_records
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[]));

CREATE POLICY "org_members_view_student_docs" ON public.student_documents
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "org_admins_manage_student_docs" ON public.student_documents
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));
