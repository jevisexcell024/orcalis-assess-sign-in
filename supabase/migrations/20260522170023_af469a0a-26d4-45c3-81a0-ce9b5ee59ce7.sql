
CREATE TABLE public.exam_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/New_York',
  max_concurrent integer NOT NULL DEFAULT 500,
  waitlist_enabled boolean NOT NULL DEFAULT true,
  notify_confirmation boolean NOT NULL DEFAULT true,
  notify_reminder boolean NOT NULL DEFAULT true,
  notify_proctors boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage schedules" ON public.exam_schedules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Candidates view schedules" ON public.exam_schedules
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'candidate') OR has_role(auth.uid(), 'proctor'));
CREATE TRIGGER tg_exam_schedules_updated BEFORE UPDATE ON public.exam_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE public.registration_status AS ENUM ('pending', 'confirmed', 'action_required', 'completed', 'cancelled');

CREATE TABLE public.exam_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL,
  schedule_id uuid REFERENCES public.exam_schedules(id) ON DELETE SET NULL,
  candidate_id uuid NOT NULL,
  status public.registration_status NOT NULL DEFAULT 'pending',
  system_check_passed boolean NOT NULL DEFAULT false,
  identity_verified boolean NOT NULL DEFAULT false,
  score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, candidate_id)
);
ALTER TABLE public.exam_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates manage own registrations" ON public.exam_registrations
  FOR ALL TO authenticated
  USING (auth.uid() = candidate_id)
  WITH CHECK (auth.uid() = candidate_id);
CREATE POLICY "Admins manage registrations" ON public.exam_registrations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Proctors view registrations" ON public.exam_registrations
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'proctor'));
CREATE TRIGGER tg_exam_registrations_updated BEFORE UPDATE ON public.exam_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE public.proctoring_severity AS ENUM ('info', 'warning', 'high');

CREATE TABLE public.proctoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.exam_registrations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity public.proctoring_severity NOT NULL DEFAULT 'info',
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.proctoring_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage events" ON public.proctoring_events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Proctors view events" ON public.proctoring_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'proctor'));
CREATE POLICY "Proctors insert events" ON public.proctoring_events
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'proctor'));
CREATE POLICY "Candidates view own events" ON public.proctoring_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.exam_registrations r
    WHERE r.id = registration_id AND r.candidate_id = auth.uid()
  ));

CREATE INDEX idx_proctoring_events_reg ON public.proctoring_events(registration_id, created_at DESC);
CREATE INDEX idx_exam_registrations_candidate ON public.exam_registrations(candidate_id);
CREATE INDEX idx_exam_schedules_exam ON public.exam_schedules(exam_id);
