
-- 1. Feedback no workout_sessions
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rpe SMALLINT CHECK (rpe BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS feedback TEXT;

-- 2. Anamnese
CREATE TABLE IF NOT EXISTS public.anamneses (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  has_health_issues BOOLEAN,
  health_issues TEXT,
  medications TEXT,
  surgeries TEXT,
  injuries TEXT,
  allergies TEXT,
  smokes BOOLEAN,
  drinks BOOLEAN,
  sleep_hours NUMERIC(3,1),
  stress_level SMALLINT CHECK (stress_level BETWEEN 1 AND 5),
  activity_history TEXT,
  goal TEXT,
  emergency_contact TEXT,
  doctor_clearance BOOLEAN DEFAULT FALSE,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamneses TO authenticated;
GRANT ALL ON public.anamneses TO service_role;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anamnese aluno self" ON public.anamneses
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "anamnese personal ve seus alunos" ON public.anamneses
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'personal'::app_role)
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = anamneses.user_id AND s.personal_id = auth.uid())
  );

CREATE POLICY "anamnese dono ve tudo" ON public.anamneses
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'dono'::app_role));

CREATE TRIGGER trg_anamneses_upd BEFORE UPDATE ON public.anamneses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Agenda (appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  title TEXT NOT NULL DEFAULT 'Sessão',
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','concluido','cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appt_personal_date ON public.appointments(personal_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appt_student_date ON public.appointments(student_id, starts_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appt personal own" ON public.appointments
  FOR ALL TO authenticated
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

CREATE POLICY "appt aluno ve seus" ON public.appointments
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "appt dono ve tudo" ON public.appointments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'dono'::app_role));

CREATE TRIGGER trg_appt_upd BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Realtime para avisos e agenda (para push in-app)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
