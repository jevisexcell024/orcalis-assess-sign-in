
DROP POLICY IF EXISTS "Candidates submit own attempt" ON public.exam_attempts;
CREATE POLICY "Candidates submit own attempt"
ON public.exam_attempts
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exam_registrations r WHERE r.id = exam_attempts.registration_id AND r.candidate_id = auth.uid())
  AND submitted_at IS NULL
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.exam_registrations r WHERE r.id = exam_attempts.registration_id AND r.candidate_id = auth.uid())
  AND score IS NULL
  AND max_score IS NULL
  AND auto_scored = false
);

CREATE OR REPLACE FUNCTION public.submit_exam_attempt(_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
AS $$
DECLARE
  v_attempt public.exam_attempts%ROWTYPE;
  v_candidate uuid;
  v_score int := 0;
  v_max int := 0;
  v_auto boolean := true;
  r record;
  v_selected int;
  v_correct int;
  v_is_correct boolean;
  v_pts int;
BEGIN
  SELECT * INTO v_attempt FROM public.exam_attempts WHERE id = _attempt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF v_attempt.submitted_at IS NOT NULL THEN RAISE EXCEPTION 'Already submitted'; END IF;

  SELECT candidate_id INTO v_candidate FROM public.exam_registrations WHERE id = v_attempt.registration_id;
  IF v_candidate <> auth.uid() THEN RAISE EXCEPTION 'Not your attempt'; END IF;

  FOR r IN
    SELECT a.id AS answer_id, a.response, q.id AS qid, q.type AS qtype, q.options AS qoptions, q.points AS qpoints
    FROM public.exam_answers a
    JOIN public.questions q ON q.id = a.question_id
    WHERE a.attempt_id = _attempt_id
  LOOP
    v_max := v_max + COALESCE(r.qpoints, 1);
    IF r.qtype IN ('mcq', 'true_false') THEN
      v_selected := NULLIF((r.response ->> 'selected'), '')::int;
      SELECT (idx - 1) INTO v_correct
        FROM jsonb_array_elements(r.qoptions) WITH ORDINALITY AS o(opt, idx)
        WHERE COALESCE((opt ->> 'is_correct')::boolean, false) = true
        LIMIT 1;
      v_is_correct := v_selected IS NOT NULL AND v_selected = v_correct;
      v_pts := CASE WHEN v_is_correct THEN COALESCE(r.qpoints, 1) ELSE 0 END;
      IF v_is_correct THEN v_score := v_score + v_pts; END IF;
      UPDATE public.exam_answers SET is_correct = v_is_correct, points_awarded = v_pts WHERE id = r.answer_id;
    ELSE
      v_auto := false;
    END IF;
  END LOOP;

  SELECT v_max + COALESCE(SUM(COALESCE(q.points, 1)), 0) INTO v_max
  FROM public.exam_sections s
  JOIN public.questions q ON q.section_id = s.id
  WHERE s.exam_id = (SELECT exam_id FROM public.exam_registrations WHERE id = v_attempt.registration_id)
    AND q.id NOT IN (SELECT question_id FROM public.exam_answers WHERE attempt_id = _attempt_id);

  UPDATE public.exam_attempts
  SET submitted_at = now(), score = v_score, max_score = v_max, auto_scored = v_auto
  WHERE id = _attempt_id;

  UPDATE public.exam_registrations
  SET score = v_score, status = 'completed'
  WHERE id = v_attempt.registration_id;

  RETURN jsonb_build_object('score', v_score, 'max_score', v_max, 'auto_scored', v_auto);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_exam_attempt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_exam_attempt(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_exam_questions_for_attempt(_attempt_id uuid)
RETURNS TABLE (
  q_id uuid,
  q_section_id uuid,
  q_position int,
  q_type question_type,
  q_prompt text,
  q_difficulty question_difficulty,
  q_points int,
  q_options jsonb,
  q_shuffle_options boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
AS $$
DECLARE
  v_exam_id uuid;
  v_candidate uuid;
BEGIN
  SELECT r.exam_id, r.candidate_id INTO v_exam_id, v_candidate
  FROM public.exam_attempts a
  JOIN public.exam_registrations r ON r.id = a.registration_id
  WHERE a.id = _attempt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF v_candidate <> auth.uid() THEN RAISE EXCEPTION 'Not your attempt'; END IF;

  RETURN QUERY
  SELECT q.id, q.section_id, q.position, q.type, q.prompt, q.difficulty, q.points,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('text', opt ->> 'text') ORDER BY ord)
        FROM jsonb_array_elements(q.options) WITH ORDINALITY AS o(opt, ord)),
      '[]'::jsonb
    ) AS options,
    q.shuffle_options
  FROM public.exam_sections s
  JOIN public.questions q ON q.section_id = s.id
  WHERE s.exam_id = v_exam_id
  ORDER BY s.position, q.position;
END;
$$;

REVOKE ALL ON FUNCTION public.get_exam_questions_for_attempt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_exam_questions_for_attempt(uuid) TO authenticated;

DROP POLICY IF EXISTS "Org members view questions" ON public.questions;
CREATE POLICY "Org members view questions"
ON public.questions
FOR SELECT
TO authenticated
USING (
  is_org_member(organization_id)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

REVOKE SELECT (token) ON public.organization_invitations FROM authenticated;
REVOKE SELECT (token) ON public.organization_invitations FROM anon;

DROP POLICY IF EXISTS "Instructors manage sections" ON public.exam_sections;
CREATE POLICY "Instructors manage sections"
ON public.exam_sections
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_sections.exam_id
      AND (has_org_role(e.organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'instructor'::org_role])
           OR has_role(auth.uid(), 'super_admin'::app_role))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_sections.exam_id
      AND (has_org_role(e.organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'instructor'::org_role])
           OR has_role(auth.uid(), 'super_admin'::app_role))
  )
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'proctoring_events') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.proctoring_events';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'exam_registrations') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.exam_registrations';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'exam_schedules') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.exam_schedules';
  END IF;
END$$;
