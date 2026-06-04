-- ============================================================
-- Result Management & Grading Workflow
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.result_status AS ENUM ('pending','auto_graded','under_review','moderated','approved','published','disputed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Result records per attempt
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.exam_registrations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  raw_score NUMERIC(10,2),
  max_score NUMERIC(10,2),
  percentage NUMERIC(6,3),
  grade TEXT,
  grade_points NUMERIC(3,2),
  status public.result_status NOT NULL DEFAULT 'pending',
  auto_graded_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  moderated_by UUID,
  moderated_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id)
);

-- Grading rubrics for descriptive questions
CREATE TABLE IF NOT EXISTS public.grading_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  criteria JSONB NOT NULL DEFAULT '[]',
  max_points NUMERIC(6,2) NOT NULL DEFAULT 10,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Manual grading events
CREATE TABLE IF NOT EXISTS public.manual_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES public.exam_answers(id) ON DELETE CASCADE,
  grader_id UUID NOT NULL,
  points_awarded NUMERIC(6,2) NOT NULL,
  feedback TEXT,
  rubric_scores JSONB DEFAULT '{}',
  graded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grade scale configuration per org
CREATE TABLE IF NOT EXISTS public.grade_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  bands JSONB NOT NULL DEFAULT '[
    {"label":"A","min":90,"max":100,"points":4.0},
    {"label":"B","min":75,"max":89,"points":3.0},
    {"label":"C","min":60,"max":74,"points":2.0},
    {"label":"D","min":50,"max":59,"points":1.0},
    {"label":"F","min":0,"max":49,"points":0.0}
  ]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Result disputes
CREATE TABLE IF NOT EXISTS public.result_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id),
  reason TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','resolved','rejected')),
  resolution TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_results" ON public.results
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_results" ON public.results
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[]));

CREATE POLICY "org_members_view_rubrics" ON public.grading_rubrics
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_rubrics" ON public.grading_rubrics
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[]));

CREATE POLICY "org_members_view_grade_scales" ON public.grade_scales
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_grade_scales" ON public.grade_scales
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));

-- Function: auto-grade an attempt and create result
CREATE OR REPLACE FUNCTION public.auto_grade_attempt(_attempt_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  _attempt public.exam_attempts;
  _raw NUMERIC;
  _max NUMERIC;
  _pct NUMERIC;
BEGIN
  SELECT * INTO _attempt FROM public.exam_attempts WHERE id = _attempt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;

  SELECT
    COALESCE(SUM(points_awarded), 0),
    COALESCE(SUM(q.points), 0)
  INTO _raw, _max
  FROM public.exam_answers ea
  JOIN public.questions q ON q.id = ea.question_id
  WHERE ea.attempt_id = _attempt_id;

  _pct := CASE WHEN _max > 0 THEN (_raw / _max) * 100 ELSE 0 END;

  INSERT INTO public.results (
    attempt_id, registration_id, organization_id,
    raw_score, max_score, percentage,
    status, auto_graded_at
  )
  SELECT
    _attempt_id,
    _attempt.registration_id,
    _attempt.organization_id,
    _raw, _max, _pct,
    'auto_graded', now()
  ON CONFLICT (attempt_id) DO UPDATE SET
    raw_score = EXCLUDED.raw_score,
    max_score = EXCLUDED.max_score,
    percentage = EXCLUDED.percentage,
    status = 'auto_graded',
    auto_graded_at = now(),
    updated_at = now();

  -- Update attempt score
  UPDATE public.exam_attempts
  SET score = _raw, max_score = _max, auto_scored = true, updated_at = now()
  WHERE id = _attempt_id;
END;
$$;
