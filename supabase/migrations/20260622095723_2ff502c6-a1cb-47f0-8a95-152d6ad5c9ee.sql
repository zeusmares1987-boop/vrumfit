CREATE TABLE public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  workout_id uuid REFERENCES public.workouts(id) ON DELETE SET NULL,
  session_date date NOT NULL DEFAULT current_date,
  duration_min integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_sessions_student_date ON public.workout_sessions(student_id, session_date DESC);
CREATE INDEX idx_workout_sessions_workout ON public.workout_sessions(workout_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT ALL ON public.workout_sessions TO service_role;

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aluno gerencia suas sessoes"
  ON public.workout_sessions FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Personal ve sessoes dos seus alunos"
  ON public.workout_sessions FOR SELECT
  USING (public.is_my_student(student_id, auth.uid()));

CREATE POLICY "Dono ve tudo sessoes"
  ON public.workout_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'dono'));

CREATE TRIGGER trg_workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();