CREATE POLICY "Candidates insert own proctoring events"
ON public.proctoring_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exam_registrations r
    WHERE r.id = proctoring_events.registration_id
      AND r.candidate_id = auth.uid()
  )
);