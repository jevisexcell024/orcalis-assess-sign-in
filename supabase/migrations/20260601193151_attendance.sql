-- ============================================================
-- Attendance Management
-- ============================================================

CREATE TYPE IF NOT EXISTS public.attendance_method AS ENUM ('qr','gps','biometric','facial','manual');
CREATE TYPE IF NOT EXISTS public.attendance_status AS ENUM ('present','absent','late','excused');

-- Attendance sessions (one per class/event)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  session_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  grace_period_minutes INTEGER NOT NULL DEFAULT 15,
  method public.attendance_method NOT NULL DEFAULT 'qr',
  qr_code TEXT,
  qr_expires_at TIMESTAMPTZ,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_radius_meters INTEGER DEFAULT 200,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual attendance records
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  status public.attendance_status NOT NULL DEFAULT 'absent',
  method public.attendance_method,
  check_in_at TIMESTAMPTZ,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  face_match_score NUMERIC(5,4),
  notes TEXT,
  marked_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

-- Meal management
CREATE TABLE IF NOT EXISTS public.meal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  exam_session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  served_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_session_id UUID NOT NULL REFERENCES public.meal_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meal_session_id, student_id)
);

-- RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_att_sessions" ON public.attendance_sessions
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_att_sessions" ON public.attendance_sessions
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor','proctor']::public.org_role[]));

CREATE POLICY "org_members_view_att_records" ON public.attendance_records
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_att_records" ON public.attendance_records
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor','proctor']::public.org_role[]));

CREATE POLICY "org_members_view_meals" ON public.meal_sessions
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_members_view_meal_records" ON public.meal_records
  FOR SELECT USING (true);
