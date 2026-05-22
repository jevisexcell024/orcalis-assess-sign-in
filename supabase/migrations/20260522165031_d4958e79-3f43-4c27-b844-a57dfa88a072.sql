
-- Enums
CREATE TYPE public.exam_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.question_type AS ENUM ('mcq', 'descriptive', 'coding', 'true_false');
CREATE TYPE public.question_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Exams
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  term TEXT,
  status public.exam_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage exams" ON public.exams
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_exams_updated
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sections
CREATE TABLE public.exam_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  time_limit_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exam_sections_exam ON public.exam_sections(exam_id, position);

ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage sections" ON public.exam_sections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_exam_sections_updated
  BEFORE UPDATE ON public.exam_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Questions (null section_id = Question Bank item)
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES public.exam_sections(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  type public.question_type NOT NULL DEFAULT 'mcq',
  prompt TEXT NOT NULL DEFAULT '',
  difficulty public.question_difficulty NOT NULL DEFAULT 'medium',
  points INTEGER NOT NULL DEFAULT 1,
  subject TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  shuffle_options BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_section ON public.questions(section_id, position);
CREATE INDEX idx_questions_bank ON public.questions(created_at DESC) WHERE section_id IS NULL;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage questions" ON public.questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_questions_updated
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
