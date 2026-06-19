
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('dono', 'personal', 'aluno');
CREATE TYPE public.user_status AS ENUM ('ativo', 'bloqueado', 'inativo');
CREATE TYPE public.workout_objective AS ENUM ('hipertrofia','emagrecimento','forca','condicionamento','saude','manutencao');
CREATE TYPE public.workout_level AS ENUM ('iniciante','intermediario','avancado');
CREATE TYPE public.workout_split AS ENUM ('fullbody','ab','abc','abcd','abcde');
CREATE TYPE public.exercise_technique AS ENUM ('normal','superserie','dropset','piramide_crescente','piramide_decrescente');
CREATE TYPE public.diet_objective AS ENUM ('emagrecimento','ganho_massa','manutencao','reeducacao','saude');
CREATE TYPE public.meal_kind AS ENUM ('cafe_manha','lanche_manha','almoco','lanche_tarde','jantar','ceia');
CREATE TYPE public.invoice_status AS ENUM ('pendente','pago','atrasado','cancelado');
CREATE TYPE public.audience_kind AS ENUM ('todos','professores','alunos','aluno_especifico');
CREATE TYPE public.publish_status AS ENUM ('ativo','inativo','rascunho');

-- ============================================================
-- UTIL: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  status public.user_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- USER_ROLES + has_role
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_role_label()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'dono' THEN 1 WHEN 'personal' THEN 2 ELSE 3 END LIMIT 1
$$;

-- Profile policies
CREATE POLICY "profiles read self or dono" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'dono') OR public.has_role(auth.uid(),'personal'));
CREATE POLICY "profiles insert self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update self or dono" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'dono'));

-- Roles policies (only dono manages roles; everyone can read own role)
CREATE POLICY "roles read self or dono" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'dono'));
CREATE POLICY "roles dono manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));

-- ============================================================
-- AUTO-CREATE profile + default role on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Default role: aluno (unless meta says personal)
  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'aluno'));
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STUDENTS (extra fields for aluno role)
-- ============================================================
CREATE TABLE public.students (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  objective public.workout_objective,
  birth_date DATE,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(6,2),
  notes TEXT,
  status public.user_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_students_upd BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "students dono all" ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "students personal own" ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'personal') AND personal_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'personal') AND personal_id = auth.uid());
CREATE POLICY "students aluno self" ON public.students FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- EXERCISE LIBRARY
-- ============================================================
CREATE TABLE public.exercise_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.exercise_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.exercise_categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (category_id, slug)
);
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.exercise_categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.exercise_subcategories(id) ON DELETE SET NULL,
  target_muscle TEXT,
  level public.workout_level NOT NULL DEFAULT 'iniciante',
  default_sets TEXT DEFAULT '3-4',
  default_reps TEXT DEFAULT '8-12',
  default_rest TEXT DEFAULT '60-90s',
  image_start TEXT,
  image_end TEXT,
  execution_steps TEXT[] DEFAULT '{}',
  common_mistakes TEXT[] DEFAULT '{}',
  status public.publish_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exercise_categories TO authenticated, anon;
GRANT SELECT ON public.exercise_subcategories TO authenticated, anon;
GRANT SELECT ON public.exercises TO authenticated, anon;
GRANT ALL ON public.exercise_categories TO service_role;
GRANT ALL ON public.exercise_subcategories TO service_role;
GRANT ALL ON public.exercises TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.exercise_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exercise_subcategories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_exercises_upd BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "cats read all" ON public.exercise_categories FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "cats dono write" ON public.exercise_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "subcats read all" ON public.exercise_subcategories FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "subcats dono write" ON public.exercise_subcategories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "ex read all" ON public.exercises FOR SELECT TO authenticated, anon USING (status = 'ativo' OR public.has_role(auth.uid(),'dono') OR public.has_role(auth.uid(),'personal'));
CREATE POLICY "ex dono write" ON public.exercises FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));

-- ============================================================
-- WORKOUTS
-- ============================================================
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective public.workout_objective NOT NULL DEFAULT 'hipertrofia',
  level public.workout_level NOT NULL DEFAULT 'iniciante',
  frequency_per_week INT NOT NULL DEFAULT 4,
  split public.workout_split NOT NULL DEFAULT 'abc',
  warmup TEXT,
  aerobic TEXT,
  stretching TEXT,
  notes TEXT,
  status public.publish_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.workout_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.workout_days(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  custom_name TEXT,
  sets TEXT NOT NULL DEFAULT '4',
  reps TEXT NOT NULL DEFAULT '12',
  load TEXT,
  rest TEXT NOT NULL DEFAULT '1 min',
  technique public.exercise_technique NOT NULL DEFAULT 'normal',
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts, public.workout_days, public.workout_exercises TO authenticated;
GRANT ALL ON public.workouts, public.workout_days, public.workout_exercises TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_workouts_upd BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "w dono" ON public.workouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "w personal own" ON public.workouts FOR ALL TO authenticated
  USING (personal_id = auth.uid()) WITH CHECK (personal_id = auth.uid());
CREATE POLICY "w aluno read" ON public.workouts FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "wd parent" ON public.workout_days FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id
    AND (public.has_role(auth.uid(),'dono') OR w.personal_id = auth.uid() OR w.student_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id
    AND (public.has_role(auth.uid(),'dono') OR w.personal_id = auth.uid())));

CREATE POLICY "we parent" ON public.workout_exercises FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_days d JOIN public.workouts w ON w.id = d.workout_id
    WHERE d.id = day_id AND (public.has_role(auth.uid(),'dono') OR w.personal_id = auth.uid() OR w.student_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_days d JOIN public.workouts w ON w.id = d.workout_id
    WHERE d.id = day_id AND (public.has_role(auth.uid(),'dono') OR w.personal_id = auth.uid())));

-- ============================================================
-- FOODS + DIETS
-- ============================================================
CREATE TABLE public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_measure TEXT,
  kcal_per_100g NUMERIC(7,2),
  protein_g NUMERIC(6,2),
  carb_g NUMERIC(6,2),
  fat_g NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.foods TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.foods TO authenticated;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods read all" ON public.foods FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "foods dono write" ON public.foods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));

CREATE TABLE public.diets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective public.diet_objective NOT NULL DEFAULT 'manutencao',
  water_liters NUMERIC(3,1) DEFAULT 2.5,
  golden_tip TEXT,
  notes TEXT,
  status public.publish_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.diet_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_id UUID NOT NULL REFERENCES public.diets(id) ON DELETE CASCADE,
  kind public.meal_kind NOT NULL,
  title TEXT NOT NULL,
  time_range TEXT,
  image_url TEXT,
  observation TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE public.diet_meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.diet_meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  custom_food TEXT,
  amount TEXT,
  measure TEXT,
  substitutions TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diets, public.diet_meals, public.diet_meal_items TO authenticated;
GRANT ALL ON public.diets, public.diet_meals, public.diet_meal_items TO service_role;
ALTER TABLE public.diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meal_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_diets_upd BEFORE UPDATE ON public.diets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "d dono" ON public.diets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "d personal" ON public.diets FOR ALL TO authenticated
  USING (personal_id = auth.uid()) WITH CHECK (personal_id = auth.uid());
CREATE POLICY "d aluno read" ON public.diets FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "dm parent" ON public.diet_meals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.diets d WHERE d.id = diet_id
    AND (public.has_role(auth.uid(),'dono') OR d.personal_id = auth.uid() OR d.student_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.diets d WHERE d.id = diet_id
    AND (public.has_role(auth.uid(),'dono') OR d.personal_id = auth.uid())));

CREATE POLICY "dmi parent" ON public.diet_meal_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.diet_meals m JOIN public.diets d ON d.id = m.diet_id
    WHERE m.id = meal_id AND (public.has_role(auth.uid(),'dono') OR d.personal_id = auth.uid() OR d.student_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.diet_meals m JOIN public.diets d ON d.id = m.diet_id
    WHERE m.id = meal_id AND (public.has_role(auth.uid(),'dono') OR d.personal_id = auth.uid())));

-- ============================================================
-- ASSESSMENTS + PROGRESS
-- ============================================================
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT current_date,
  weight_kg NUMERIC(6,2),
  height_cm NUMERIC(5,2),
  bmi NUMERIC(5,2),
  chest_cm NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  abdomen_cm NUMERIC(5,2),
  hip_cm NUMERIC(5,2),
  arm_r_cm NUMERIC(5,2),
  arm_l_cm NUMERIC(5,2),
  thigh_r_cm NUMERIC(5,2),
  thigh_l_cm NUMERIC(5,2),
  calf_cm NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT current_date,
  weight_kg NUMERIC(6,2),
  attended BOOLEAN,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments, public.progress_entries TO authenticated;
GRANT ALL ON public.assessments, public.progress_entries TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asm dono" ON public.assessments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "asm personal" ON public.assessments FOR ALL TO authenticated
  USING (personal_id = auth.uid() OR EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = student_id AND s.personal_id = auth.uid()))
  WITH CHECK (personal_id = auth.uid() OR EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = student_id AND s.personal_id = auth.uid()));
CREATE POLICY "asm aluno read" ON public.assessments FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "pe dono" ON public.progress_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "pe aluno self" ON public.progress_entries FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "pe personal" ON public.progress_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = student_id AND s.personal_id = auth.uid()));

-- ============================================================
-- STORE + FINANCE
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_desc TEXT,
  description TEXT,
  benefits TEXT[],
  price_cents INT NOT NULL DEFAULT 0,
  cover_url TEXT,
  file_url TEXT,
  category TEXT,
  status public.publish_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents INT NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'pendente',
  mp_payment_id TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  price_cents INT NOT NULL,
  qty INT NOT NULL DEFAULT 1
);
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  benefits TEXT[],
  period TEXT NOT NULL DEFAULT 'mensal',
  status public.publish_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  amount_cents INT NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'pendente',
  paid_at TIMESTAMPTZ,
  mp_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products, public.plans TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.products, public.plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders, public.order_items, public.invoices TO authenticated;
GRANT ALL ON public.products, public.plans, public.orders, public.order_items, public.invoices TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_products_upd BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_upd BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_invoices_upd BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "prod read pub" ON public.products FOR SELECT TO authenticated, anon USING (status='ativo' OR public.has_role(auth.uid(),'dono'));
CREATE POLICY "prod dono" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "plans read" ON public.plans FOR SELECT TO authenticated, anon USING (status='ativo' OR public.has_role(auth.uid(),'dono'));
CREATE POLICY "plans dono" ON public.plans FOR ALL TO authenticated USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "orders dono" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "orders buyer" ON public.orders FOR ALL TO authenticated USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "oi parent" ON public.order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR public.has_role(auth.uid(),'dono'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR public.has_role(auth.uid(),'dono'))));
CREATE POLICY "inv dono" ON public.invoices FOR ALL TO authenticated USING (public.has_role(auth.uid(),'dono')) WITH CHECK (public.has_role(auth.uid(),'dono'));
CREATE POLICY "inv aluno read" ON public.invoices FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "inv personal read" ON public.invoices FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = student_id AND s.personal_id = auth.uid()));

-- ============================================================
-- NOTICES / FILES / SUPPORT
-- ============================================================
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience public.audience_kind NOT NULL DEFAULT 'todos',
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.publish_status NOT NULL DEFAULT 'ativo',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime TEXT,
  audience public.audience_kind NOT NULL DEFAULT 'todos',
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices, public.files, public.support_tickets TO authenticated;
GRANT ALL ON public.notices, public.files, public.support_tickets TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notice read" ON public.notices FOR SELECT TO authenticated USING (
  status='ativo' AND (
    audience='todos'
    OR (audience='professores' AND public.has_role(auth.uid(),'personal'))
    OR (audience='alunos' AND public.has_role(auth.uid(),'aluno'))
    OR (audience='aluno_especifico' AND target_user_id = auth.uid())
    OR public.has_role(auth.uid(),'dono')
  )
);
CREATE POLICY "notice write" ON public.notices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono') OR (public.has_role(auth.uid(),'personal') AND created_by = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'dono') OR (public.has_role(auth.uid(),'personal') AND created_by = auth.uid()));

CREATE POLICY "files read" ON public.files FOR SELECT TO authenticated USING (
  audience='todos'
  OR (audience='professores' AND public.has_role(auth.uid(),'personal'))
  OR (audience='alunos' AND public.has_role(auth.uid(),'aluno'))
  OR (audience='aluno_especifico' AND target_user_id = auth.uid())
  OR public.has_role(auth.uid(),'dono')
  OR uploaded_by = auth.uid()
);
CREATE POLICY "files write" ON public.files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'dono') OR uploaded_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'dono') OR uploaded_by = auth.uid());

CREATE POLICY "tk own" ON public.support_tickets FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'dono'))
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- SEED: exercise categories & subcategories
-- ============================================================
INSERT INTO public.exercise_categories (slug,name,sort_order) VALUES
 ('pernas','Pernas',1),('peito','Peito',2),('costas','Costas',3),
 ('ombros','Ombros',4),('biceps','Bíceps',5),('triceps','Tríceps',6),
 ('abdomen','Abdômen',7),('cardio','Cardio',8),('funcional','Funcional',9),
 ('mobilidade','Mobilidade e Alongamento',10);

INSERT INTO public.exercise_subcategories (category_id, slug, name)
SELECT c.id, s.slug, s.name FROM public.exercise_categories c
JOIN (VALUES
 ('pernas','quadriceps','Quadríceps'),('pernas','posterior','Posterior'),
 ('pernas','gluteos','Glúteos'),('pernas','adutores','Adutores'),
 ('pernas','abdutores','Abdutores'),('pernas','panturrilha','Panturrilha'),
 ('abdomen','superior','Superior'),('abdomen','inferior','Inferior'),
 ('abdomen','obliquos','Oblíquos'),('abdomen','core','Core estável'),
 ('cardio','hiit','HIIT'),('cardio','baixa','Baixa intensidade'),
 ('cardio','continuo','Aeróbico contínuo')
) AS s(cat,slug,name) ON c.slug = s.cat;

-- Seed foods (banco básico)
INSERT INTO public.foods (name,category,default_measure,kcal_per_100g,protein_g,carb_g,fat_g) VALUES
 ('Arroz branco cozido','Carboidratos','1 xícara',130,2.7,28,0.3),
 ('Arroz integral cozido','Carboidratos','1 xícara',124,2.6,26,1),
 ('Feijão preto cozido','Carboidratos','1 concha',77,4.5,14,0.5),
 ('Batata doce cozida','Carboidratos','1 unidade média',86,1.6,20,0.1),
 ('Aveia em flocos','Carboidratos','3 colheres sopa',389,16.9,66,6.9),
 ('Pão integral','Carboidratos','1 fatia',253,9,43,3.4),
 ('Frango grelhado','Proteínas','1 filé (120g)',165,31,0,3.6),
 ('Ovo cozido','Proteínas','1 unidade',155,13,1.1,11),
 ('Carne magra','Proteínas','1 porção (100g)',250,26,0,17),
 ('Peixe (tilápia)','Proteínas','1 filé',96,20,0,1.7),
 ('Whey protein','Proteínas','1 scoop',400,80,8,5),
 ('Iogurte natural','Laticínios','1 pote',61,3.5,4.7,3.3),
 ('Leite desnatado','Laticínios','1 copo',35,3.4,5,0.1),
 ('Azeite extra virgem','Gorduras boas','1 colher de sopa',884,0,0,100),
 ('Castanhas mistas','Gorduras boas','1 punhado',607,15,21,54),
 ('Abacate','Gorduras boas','1/2 unidade',160,2,9,15),
 ('Banana','Frutas','1 unidade',89,1.1,23,0.3),
 ('Maçã','Frutas','1 unidade',52,0.3,14,0.2),
 ('Morango','Frutas','1 xícara',32,0.7,7.7,0.3),
 ('Brócolis','Verduras','1 xícara',34,2.8,7,0.4),
 ('Salada variada','Verduras','1 prato',20,1.5,3,0.2),
 ('Cenoura','Legumes','1 unidade',41,0.9,10,0.2),
 ('Sanduíche natural','Refeição','1 unidade',250,15,30,8),
 ('Vitamina de frutas','Bebidas','1 copo',150,6,25,3),
 ('Água','Bebidas','1 copo',0,0,0,0);
