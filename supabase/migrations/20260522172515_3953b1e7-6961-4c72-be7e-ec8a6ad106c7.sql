ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proctoring_events;
ALTER TABLE public.exam_registrations REPLICA IDENTITY FULL;
ALTER TABLE public.proctoring_events REPLICA IDENTITY FULL;
ALTER TABLE public.exam_schedules REPLICA IDENTITY FULL;