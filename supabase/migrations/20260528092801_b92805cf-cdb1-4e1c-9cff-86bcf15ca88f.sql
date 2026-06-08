
-- exam_attempts: one per registration
CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE,
  organization_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  score integer,
  max_score integer,
  auto_scored boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates view own attempts" ON public.exam_attempts
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exam_registrations r
  WHERE r.id = exam_attempts.registration_id AND r.candidate_id = auth.uid()
));

CREATE POLICY "Org staff view attempts" ON public.exam_attempts
FOR SELECT TO authenticated
USING (
  has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role,'instructor'::org_role,'proctor'::org_role])
  OR has_role(auth.uid(),'super_admin'::app_role)
);

CREATE POLICY "Candidates start own attempt" ON public.exam_attempts
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.exam_registrations r
          WHERE r.id = exam_attempts.registration_id AND r.candidate_id = auth.uid())
  AND submitted_at IS NULL AND score IS NULL
);

CREATE POLICY "Candidates submit own attempt" ON public.exam_attempts
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exam_registrations r
          WHERE r.id = exam_attempts.registration_id AND r.candidate_id = auth.uid())
  AND submitted_at IS NULL
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.exam_registrations r
          WHERE r.id = exam_attempts.registration_id AND r.candidate_id = auth.uid())
);

CREATE POLICY "Org staff manage attempts" ON public.exam_attempts
FOR ALL TO authenticated
USING (
  has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role,'instructor'::org_role])
  OR has_role(auth.uid(),'super_admin'::app_role)
)
WITH CHECK (
  has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role,'instructor'::org_role])
  OR has_role(auth.uid(),'super_admin'::app_role)
);

-- exam_answers
CREATE TABLE public.exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL,
  question_id uuid NOT NULL,
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_correct boolean,
  points_awarded integer,
  answered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_exam_answers_attempt ON public.exam_answers(attempt_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_answers TO authenticated;
GRANT ALL ON public.exam_answers TO service_role;

ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates manage own answers" ON public.exam_answers
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exam_attempts a
  JOIN public.exam_registrations r ON r.id = a.registration_id
  WHERE a.id = exam_answers.attempt_id
    AND r.candidate_id = auth.uid()
    AND a.submitted_at IS NULL
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.exam_attempts a
  JOIN public.exam_registrations r ON r.id = a.registration_id
  WHERE a.id = exam_answers.attempt_id
    AND r.candidate_id = auth.uid()
    AND a.submitted_at IS NULL
));

CREATE POLICY "Candidates view own answers" ON public.exam_answers
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exam_attempts a
  JOIN public.exam_registrations r ON r.id = a.registration_id
  WHERE a.id = exam_answers.attempt_id AND r.candidate_id = auth.uid()
));

CREATE POLICY "Org staff view answers" ON public.exam_answers
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exam_attempts a
  WHERE a.id = exam_answers.attempt_id
    AND (
      has_org_role(a.organization_id, ARRAY['owner'::org_role,'admin'::org_role,'instructor'::org_role,'proctor'::org_role])
      OR has_role(auth.uid(),'super_admin'::app_role)
    )
));

CREATE POLICY "Org staff manage answers" ON public.exam_answers
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.exam_attempts a
  WHERE a.id = exam_answers.attempt_id
    AND (
      has_org_role(a.organization_id, ARRAY['owner'::org_role,'admin'::org_role,'instructor'::org_role])
      OR has_role(auth.uid(),'super_admin'::app_role)
    )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.exam_attempts a
  WHERE a.id = exam_answers.attempt_id
    AND (
      has_org_role(a.organization_id, ARRAY['owner'::org_role,'admin'::org_role,'instructor'::org_role])
      OR has_role(auth.uid(),'super_admin'::app_role)
    )
));

CREATE TRIGGER trg_exam_attempts_updated BEFORE UPDATE ON public.exam_attempts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_exam_answers_updated BEFORE UPDATE ON public.exam_answers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
