-- ============================================================
-- Audit Logs, Communication, Academic Integrity
-- ============================================================

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all','students','instructors','admins','specific')),
  audience_ids UUID[] DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  channels TEXT[] NOT NULL DEFAULT '{in_app}',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages (direct messaging)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  deleted_by_sender BOOLEAN NOT NULL DEFAULT false,
  deleted_by_recipient BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id),
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  exam_reminders BOOLEAN NOT NULL DEFAULT true,
  result_notifications BOOLEAN NOT NULL DEFAULT true,
  announcement_notifications BOOLEAN NOT NULL DEFAULT true,
  message_notifications BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Academic Integrity
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.integrity_check_type AS ENUM (
    'plagiarism','ai_generated','copy_paste','external_resource','identity_mismatch'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.integrity_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.exam_answers(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id),
  check_type public.integrity_check_type NOT NULL,
  score NUMERIC(5,4),
  threshold NUMERIC(5,4) NOT NULL DEFAULT 0.8,
  flagged BOOLEAN NOT NULL DEFAULT false,
  details JSONB DEFAULT '{}',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  cleared BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Certificates (actual data-backed)
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id),
  organization_id UUID REFERENCES public.organizations(id),
  exam_id UUID REFERENCES public.exams(id),
  certificate_number TEXT NOT NULL UNIQUE DEFAULT 'CERT-' || upper(substring(gen_random_uuid()::text,1,8)),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  template_id UUID,
  pdf_url TEXT,
  qr_code TEXT,
  blockchain_hash TEXT,
  blockchain_tx TEXT,
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MFA / 2FA
CREATE TABLE IF NOT EXISTS public.mfa_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  totp_secret TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[],
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device sessions
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trusted BOOLEAN NOT NULL DEFAULT false,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_sessions_user ON public.device_sessions(user_id);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admins_view_audit_logs" ON public.audit_logs
  FOR SELECT USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));

CREATE POLICY "org_members_view_announcements" ON public.announcements
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "org_admins_manage_announcements" ON public.announcements
  FOR ALL USING (public.has_org_role(organization_id, ARRAY['owner','admin']::public.org_role[]));

CREATE POLICY "own_messages" ON public.messages
  FOR ALL USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "own_notification_prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "org_admins_view_integrity" ON public.integrity_checks
  FOR SELECT USING (public.has_org_role(organization_id, ARRAY['owner','admin','instructor']::public.org_role[]));

CREATE POLICY "org_members_view_certificates" ON public.certificates
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "own_mfa_config" ON public.mfa_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_device_sessions" ON public.device_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Audit log function (trigger-based)
CREATE OR REPLACE FUNCTION public.create_audit_log(
  _org_id UUID,
  _action TEXT,
  _resource_type TEXT,
  _resource_id TEXT DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id, actor_id, actor_email,
    action, resource_type, resource_id,
    old_values, new_values
  )
  SELECT
    _org_id, auth.uid(), u.email,
    _action, _resource_type, _resource_id,
    _old_values, _new_values
  FROM auth.users u WHERE u.id = auth.uid();
END;
$$;
