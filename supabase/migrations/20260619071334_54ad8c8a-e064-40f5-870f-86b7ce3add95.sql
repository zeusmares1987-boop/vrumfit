
-- 1) Extend plans
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS role_target TEXT NOT NULL DEFAULT 'professor' CHECK (role_target IN ('dono','professor','aluno')),
  ADD COLUMN IF NOT EXISTS max_students INTEGER,
  ADD COLUMN IF NOT EXISTS trial_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_offers INTEGER,
  ADD COLUMN IF NOT EXISTS can_generate_workout BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_generate_diet BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 2) Seed plans (idempotent)
INSERT INTO public.plans (slug, name, price_cents, period, role_target, max_students, trial_days, can_generate_workout, can_generate_diet, max_offers, description, benefits, status) VALUES
  ('professor_teste',     'Professor — Teste Grátis', 0,    'mensal',  'professor', 1,    10, true,  true,  NULL, 'Teste grátis de 10 dias com 1 aluno',
    ARRAY['10 dias grátis','1 aluno','Gerar treino e dieta','Biblioteca VrumFit'], 'ativo'),
  ('professor_4',         'Professor 4 Alunos',       990,  'mensal',  'professor', 4,    0,  true,  true,  NULL, 'Até 4 alunos ativos',
    ARRAY['Até 4 alunos','Gerar treino/dieta + PDF','Avisos','Biblioteca VrumFit','WhatsApp do aluno'], 'ativo'),
  ('professor_ilimitado', 'Professor Ilimitado',      2990, 'mensal',  'professor', NULL, 0,  true,  true,  NULL, 'Alunos ilimitados',
    ARRAY['Alunos ilimitados','Gerar treino/dieta + PDF','Avisos gerais e individuais','Biblioteca VrumFit','Arquivos dos alunos'], 'ativo'),
  ('aluno_basico',        'Aluno Básico (Grátis)',    0,    'mensal',  'aluno',     NULL, 0,  false, false, NULL, 'Cadastrado pelo professor, acesso básico',
    ARRAY['Recebe treino e dieta do professor','Avisos','Biblioteca básica'], 'ativo'),
  ('aluno_mensal',        'Aluno Mensal',             1990, 'mensal',  'aluno',     NULL, 0,  true,  true,  NULL, 'Aluno individual com recursos completos',
    ARRAY['Gerar treino e dieta','PDF','Progresso','Biblioteca completa','Loja'], 'ativo'),
  ('ofertas_professor',   'Ofertas do Professor',     1990, 'mensal',  'professor', NULL, 0,  false, false, 5,    'Publicar até 5 ofertas/serviços',
    ARRAY['Até 5 ofertas publicadas','Pagamento via Mercado Pago'], 'ativo')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, price_cents=EXCLUDED.price_cents, role_target=EXCLUDED.role_target,
  max_students=EXCLUDED.max_students, trial_days=EXCLUDED.trial_days, max_offers=EXCLUDED.max_offers,
  can_generate_workout=EXCLUDED.can_generate_workout, can_generate_diet=EXCLUDED.can_generate_diet,
  description=EXCLUDED.description, benefits=EXCLUDED.benefits;

-- 3) Subscriptions
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trial','ativo','vencido','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status public.subscription_status NOT NULL DEFAULT 'ativo',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  mp_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_active_idx ON public.subscriptions(user_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subs read self or dono" ON public.subscriptions;
CREATE POLICY "subs read self or dono" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'dono'));
DROP POLICY IF EXISTS "subs insert self" ON public.subscriptions;
CREATE POLICY "subs insert self" ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'dono'));
DROP POLICY IF EXISTS "subs update dono" ON public.subscriptions;
CREATE POLICY "subs update dono" ON public.subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
DROP POLICY IF EXISTS "subs delete dono" ON public.subscriptions;
CREATE POLICY "subs delete dono" ON public.subscriptions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'dono'));

DROP TRIGGER IF EXISTS trg_subs_upd ON public.subscriptions;
CREATE TRIGGER trg_subs_upd BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Helper functions
CREATE OR REPLACE FUNCTION public.current_plan(_uid UUID)
RETURNS public.plans
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _uid
    AND s.status IN ('trial','ativo')
    AND (s.expires_at IS NULL OR s.expires_at > now())
  ORDER BY p.price_cents DESC, s.started_at DESC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_add_student(_personal_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pl public.plans;
  cnt INTEGER;
BEGIN
  IF public.has_role(_personal_id,'dono') THEN RETURN TRUE; END IF;
  pl := public.current_plan(_personal_id);
  IF pl.id IS NULL THEN RETURN FALSE; END IF;
  IF pl.role_target <> 'professor' THEN RETURN FALSE; END IF;
  IF pl.max_students IS NULL THEN RETURN TRUE; END IF;
  SELECT COUNT(*) INTO cnt FROM public.students
    WHERE personal_id = _personal_id AND status = 'ativo';
  RETURN cnt < pl.max_students;
END $$;

-- 5) Enforce limit on students insert/update
CREATE OR REPLACE FUNCTION public.enforce_student_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.personal_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.personal_id IS NOT DISTINCT FROM OLD.personal_id
     AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status = 'ativo' AND NOT public.can_add_student(NEW.personal_id) THEN
    RAISE EXCEPTION 'Limite de alunos do plano atingido ou plano vencido';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_students_limit ON public.students;
CREATE TRIGGER trg_students_limit BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.enforce_student_limit();
